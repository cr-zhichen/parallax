import { isChartableModel, type ModelPoint } from "@/lib/models";

type ChartableModel = ModelPoint & {
  intelligence: number;
  costPerTask: number;
};

export interface KneeRecommendation extends ChartableModel {
  kneeScore: number;
  idealDistance: number;
}

export interface Alternative extends ChartableModel {
  scoreDelta: number;
  costDeltaRatio: number;
}

export interface ReasoningVariantGroup {
  key: string;
  baseName: string;
  creator: string;
  models: ChartableModel[];
}

const REASONING_LEVEL_RANKS = new Map<string, number>([
  ["nonreasoning", -1],
  ["minimal", 0],
  ["low", 1],
  ["medium", 2],
  ["high", 3],
  ["xhigh", 4],
  ["max", 5],
  ["ultra", 6],
]);

const TRAILING_MODEL_DETAILS = /\s*\(([^()]*)\)\s*$/;
const REASONING_LEVEL_DETAIL =
  /^(non[\s-]?reasoning|minimal|low|medium|high|x[\s-]?high|max|ultra)(?:\s+effort)?$/i;

export function chartableModels(models: ModelPoint[]): ChartableModel[] {
  return models.filter(isChartableModel);
}

function parseReasoningVariant(model: ChartableModel) {
  const detailsMatch = model.name.match(TRAILING_MODEL_DETAILS);
  if (!detailsMatch) return null;

  const levelMatch = detailsMatch[1]
    .split(",")
    .map((detail) => detail.trim().match(REASONING_LEVEL_DETAIL))
    .find((match) => match !== null);
  if (!levelMatch) return null;

  const level = levelMatch[1].toLocaleLowerCase().replace(/[\s-]/g, "");
  const rank = REASONING_LEVEL_RANKS.get(level);
  if (rank === undefined) return null;

  const baseName = model.name.slice(0, detailsMatch.index).trim();
  if (!baseName) return null;

  return { baseName, level, rank };
}

export function getReasoningVariantGroups(
  models: ModelPoint[],
): ReasoningVariantGroup[] {
  const groups = new Map<
    string,
    {
      baseName: string;
      creator: string;
      variants: Array<{ model: ChartableModel; level: string; rank: number }>;
    }
  >();

  for (const model of chartableModels(models)) {
    const variant = parseReasoningVariant(model);
    if (!variant) continue;

    const key = `${model.creator.toLocaleLowerCase()}::${variant.baseName.toLocaleLowerCase()}`;
    const group = groups.get(key) ?? {
      baseName: variant.baseName,
      creator: model.creator,
      variants: [],
    };

    group.variants.push({
      model,
      level: variant.level,
      rank: variant.rank,
    });
    groups.set(key, group);
  }

  return Array.from(groups, ([key, group]) => ({ key, ...group }))
    .filter(
      (group) =>
        new Set(group.variants.map((variant) => variant.level)).size > 1,
    )
    .map(({ key, baseName, creator, variants }) => ({
      key,
      baseName,
      creator,
      models: variants
        .sort(
          (a, b) =>
            a.rank - b.rank ||
            a.model.costPerTask - b.model.costPerTask ||
            a.model.id.localeCompare(b.model.id),
        )
        .map((variant) => variant.model),
    }))
    .sort(
      (a, b) =>
        a.creator.localeCompare(b.creator) ||
        a.baseName.localeCompare(b.baseName),
    );
}

export function findStrictAlternatives(
  models: ModelPoint[],
  selected: ModelPoint,
): Alternative[] {
  if (!isChartableModel(selected)) return [];

  return chartableModels(models)
    .filter(
      (model) =>
        model.id !== selected.id &&
        model.intelligence >= selected.intelligence &&
        model.costPerTask <= selected.costPerTask &&
        (model.intelligence > selected.intelligence ||
          model.costPerTask < selected.costPerTask),
    )
    .map((model) => ({
      ...model,
      scoreDelta: model.intelligence - selected.intelligence,
      costDeltaRatio:
        (model.costPerTask - selected.costPerTask) / selected.costPerTask,
    }))
    .sort((a, b) => {
      const aGain = a.scoreDelta - a.costDeltaRatio * 8;
      const bGain = b.scoreDelta - b.costDeltaRatio * 8;
      return bGain - aGain;
    });
}

export function findBalancedAlternatives(
  models: ModelPoint[],
  selected: ModelPoint,
  limit = 50,
): Alternative[] {
  if (!isChartableModel(selected)) return [];

  const strictIds = new Set(
    findStrictAlternatives(models, selected).map((model) => model.id),
  );

  return chartableModels(models)
    .filter(
      (model) =>
        model.id !== selected.id &&
        !strictIds.has(model.id) &&
        model.intelligence >= selected.intelligence - 2.5 &&
        model.costPerTask <= selected.costPerTask * 1.25,
    )
    .map((model) => ({
      ...model,
      scoreDelta: model.intelligence - selected.intelligence,
      costDeltaRatio:
        (model.costPerTask - selected.costPerTask) / selected.costPerTask,
    }))
    .sort((a, b) => {
      const aUtility = a.scoreDelta - Math.log2(1 + a.costPerTask) * 2;
      const bUtility = b.scoreDelta - Math.log2(1 + b.costPerTask) * 2;
      return bUtility - aUtility;
    })
    .slice(0, limit);
}

export function getParetoFrontier(models: ModelPoint[]): ChartableModel[] {
  const sorted = chartableModels(models).sort(
    (a, b) =>
      a.costPerTask - b.costPerTask || b.intelligence - a.intelligence,
  );

  let bestScore = Number.NEGATIVE_INFINITY;

  return sorted.filter((model) => {
    if (model.intelligence <= bestScore) return false;
    bestScore = model.intelligence;
    return true;
  });
}

const KNEE_TIE_TOLERANCE = 1e-12;

function scoreKneeFrontier(frontier: ChartableModel[]): KneeRecommendation[] {
  if (frontier.length === 0) return [];
  if (frontier.length === 1) {
    return [
      {
        ...frontier[0],
        kneeScore: 0,
        idealDistance: 0,
      },
    ];
  }

  const cheapest = frontier[0];
  const strongest = frontier[frontier.length - 1];
  const minLogCost = Math.log10(cheapest.costPerTask);
  const logCostRange = Math.log10(strongest.costPerTask) - minLogCost;
  const intelligenceRange = strongest.intelligence - cheapest.intelligence;

  return frontier
    .map((model) => {
      const normalizedCost =
        (Math.log10(model.costPerTask) - minLogCost) / logCostRange;
      const normalizedIntelligence =
        (model.intelligence - cheapest.intelligence) / intelligenceRange;

      return {
        ...model,
        // Proportional to the signed perpendicular distance above the line
        // connecting the cheapest and strongest Pareto-frontier endpoints.
        kneeScore: normalizedIntelligence - normalizedCost,
        idealDistance: Math.hypot(normalizedCost, 1 - normalizedIntelligence),
      };
    })
    .sort((a, b) => {
      const kneeDelta = b.kneeScore - a.kneeScore;
      if (Math.abs(kneeDelta) > KNEE_TIE_TOLERANCE) return kneeDelta;

      const idealDelta = a.idealDistance - b.idealDistance;
      if (Math.abs(idealDelta) > KNEE_TIE_TOLERANCE) return idealDelta;

      return a.costPerTask - b.costPerTask;
    });
}

export function getKneeRecommendations(
  models: ModelPoint[],
  limit = 5,
): KneeRecommendation[] {
  const frontier = getParetoFrontier(chartableModels(models));
  const normalizedLimit = Math.max(0, Math.floor(limit));
  return scoreKneeFrontier(frontier).slice(0, normalizedLimit);
}

export function pickDefaultModel(models: ModelPoint[]): ModelPoint | undefined {
  const chartable = chartableModels(models);
  if (chartable.length === 0) return models[0];

  return getKneeRecommendations(chartable, 1)[0];
}

export function creatorsFromModels(models: ModelPoint[]): string[] {
  return Array.from(new Set(models.map((model) => model.creator))).sort((a, b) =>
    a.localeCompare(b),
  );
}

function normalizedSearchValue(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function searchModels(models: ModelPoint[], query: string): ModelPoint[] {
  const normalizedQuery = normalizedSearchValue(query);
  if (!normalizedQuery) return [];

  const tokens = normalizedQuery.split(/\s+/);

  return models
    .filter((model) => {
      const fields = [model.name, model.slug, model.creator].map(
        normalizedSearchValue,
      );

      return tokens.every((token) =>
        fields.some((field) => field.includes(token)),
      );
    })
    .sort((a, b) => {
      const aTime = a.releaseDate ? Date.parse(a.releaseDate) : Number.NaN;
      const bTime = b.releaseDate ? Date.parse(b.releaseDate) : Number.NaN;
      const normalizedATime = Number.isFinite(aTime)
        ? aTime
        : Number.NEGATIVE_INFINITY;
      const normalizedBTime = Number.isFinite(bTime)
        ? bTime
        : Number.NEGATIVE_INFINITY;

      return normalizedBTime - normalizedATime || a.name.localeCompare(b.name);
    });
}

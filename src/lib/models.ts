export const CATALOG_REFRESH_HOURS = 8;
export const CATALOG_REFRESH_SECONDS = CATALOG_REFRESH_HOURS * 60 * 60;
export const CATALOG_REFRESH_MS = CATALOG_REFRESH_SECONDS * 1000;

export type SourceMode = "live" | "demo";
export type SourceNoticeKey = "missingApiKey" | "apiError" | "unavailable";

export interface ModelPoint {
  id: string;
  slug: string;
  name: string;
  creator: string;
  creatorId: string | null;
  releaseDate: string | null;
  reasoning: boolean;
  intelligence: number | null;
  coding: number | null;
  agentic: number | null;
  costPerTask: number | null;
  inputPrice: number | null;
  outputPrice: number | null;
  blendedPrice: number | null;
  outputSpeed: number | null;
  latency: number | null;
}

export interface ModelCatalog {
  models: ModelPoint[];
  syncedAt: string;
  refreshIntervalMs: number;
  indexVersion: number | null;
  source: {
    mode: SourceMode;
    provider: "Artificial Analysis";
    tier: string;
    url: string;
    notice?: string;
    noticeKey?: SourceNoticeKey;
    noticeStatus?: number;
  };
}

export function isChartableModel(
  model: ModelPoint,
): model is ModelPoint & { intelligence: number; costPerTask: number } {
  return (
    typeof model.intelligence === "number" &&
    Number.isFinite(model.intelligence) &&
    typeof model.costPerTask === "number" &&
    Number.isFinite(model.costPerTask) &&
    model.costPerTask > 0
  );
}

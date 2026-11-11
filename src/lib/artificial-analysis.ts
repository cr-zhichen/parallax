import "server-only";

import { readCatalogCache, writeCatalogCache } from "@/lib/catalog-cache";
import { getDemoCatalog } from "@/lib/demo-data";
import { getNextCatalogRefreshBoundary } from "@/lib/refresh-schedule";
import {
  CATALOG_REFRESH_MS,
  CATALOG_REFRESH_SECONDS,
  type ModelCatalog,
  type ModelPoint,
} from "@/lib/models";

const API_BASE_URL = "https://artificialanalysis.ai/api/v2";
export const MODEL_CACHE_TAG = "artificial-analysis-language-models";

interface ApiModel {
  id: string;
  name: string;
  slug: string;
  release_date?: string | null;
  reasoning_model?: boolean;
  model_creator: {
    id?: string;
    name: string;
  };
  evaluations?: {
    artificial_analysis_intelligence_index?: number | null;
    artificial_analysis_coding_index?: number | null;
    artificial_analysis_agentic_index?: number | null;
  };
  artificial_analysis_intelligence_index_cost?: {
    cost_per_task?: {
      total_cost?: number | null;
    };
  };
  pricing?: {
    price_1m_blended_3_to_1?: number | null;
    price_1m_input_tokens?: number | null;
    price_1m_output_tokens?: number | null;
  };
  performance_v3?: {
    mean_output_tokens_per_second?: number | null;
    mean_time_to_first_token_seconds?: number | null;
  } | null;
}

interface ApiEnvelope {
  tier: string;
  intelligence_index_version?: number;
  pagination: {
    page: number;
    page_size: number;
    total_pages: number;
    has_more: boolean;
  };
  data: ApiModel[];
}

interface ApiPage {
  envelope: ApiEnvelope;
  responseDate: string | null;
}

interface CatalogRuntimeState {
  catalog: ModelCatalog | null;
  validUntil: number;
  refreshPromise: Promise<ModelCatalog> | null;
  cacheLoaded: boolean;
  cacheLoadPromise: Promise<void> | null;
}

interface GetModelCatalogOptions {
  force?: boolean;
}

class ArtificialAnalysisError extends Error {
  constructor(public readonly status: number) {
    super(`Artificial Analysis request failed with status ${status}`);
  }
}

const catalogGlobal = globalThis as typeof globalThis & {
  __parallaxModelCatalog?: CatalogRuntimeState;
};

const catalogState =
  catalogGlobal.__parallaxModelCatalog ??
  (catalogGlobal.__parallaxModelCatalog = {
    catalog: null,
    validUntil: 0,
    refreshPromise: null,
    cacheLoaded: false,
    cacheLoadPromise: null,
  });

function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeModel(model: ApiModel): ModelPoint {
  const inputPrice = finiteOrNull(model.pricing?.price_1m_input_tokens);
  const outputPrice = finiteOrNull(model.pricing?.price_1m_output_tokens);
  const blendedFromApi = finiteOrNull(
    model.pricing?.price_1m_blended_3_to_1,
  );

  return {
    id: model.id,
    slug: model.slug,
    name: model.name,
    creator: model.model_creator.name,
    creatorId: model.model_creator.id ?? null,
    releaseDate: model.release_date ?? null,
    reasoning: model.reasoning_model ?? false,
    intelligence: finiteOrNull(
      model.evaluations?.artificial_analysis_intelligence_index,
    ),
    coding: finiteOrNull(
      model.evaluations?.artificial_analysis_coding_index,
    ),
    agentic: finiteOrNull(
      model.evaluations?.artificial_analysis_agentic_index,
    ),
    costPerTask: finiteOrNull(
      model.artificial_analysis_intelligence_index_cost?.cost_per_task
        ?.total_cost,
    ),
    inputPrice,
    outputPrice,
    blendedPrice:
      blendedFromApi ??
      (inputPrice !== null && outputPrice !== null
        ? (inputPrice * 3 + outputPrice) / 4
        : null),
    outputSpeed: finiteOrNull(
      model.performance_v3?.mean_output_tokens_per_second,
    ),
    latency: finiteOrNull(
      model.performance_v3?.mean_time_to_first_token_seconds,
    ),
  };
}

function getEndpoint(): string {
  const configuredTier = process.env.ARTIFICIAL_ANALYSIS_API_TIER?.toLowerCase();
  return configuredTier === "pro" || configuredTier === "commercial"
    ? "/language/models"
    : "/language/models/free";
}

async function ensureCatalogCacheLoaded(): Promise<void> {
  if (catalogState.cacheLoaded) return;
  if (catalogState.cacheLoadPromise) return catalogState.cacheLoadPromise;

  catalogState.cacheLoadPromise = (async () => {
    const snapshot = await readCatalogCache();
    if (!snapshot) return;

    catalogState.catalog = snapshot.catalog;
    catalogState.validUntil = getNextCatalogRefreshBoundary(
      new Date(snapshot.savedAt),
    ).getTime();

    console.info("[Parallax] Restored model catalog cache", {
      modelCount: snapshot.catalog.models.length,
      savedAt: snapshot.savedAt,
      validUntil: new Date(catalogState.validUntil).toISOString(),
    });
  })()
    .catch((error) => {
      console.warn("[Parallax] Model catalog cache restore failed", {
        error: error instanceof Error ? error.name : "UnknownError",
      });
    })
    .finally(() => {
      catalogState.cacheLoaded = true;
      catalogState.cacheLoadPromise = null;
    });

  return catalogState.cacheLoadPromise;
}

async function fetchPage(
  apiKey: string,
  endpoint: string,
  page: number,
  bypassCache: boolean,
): Promise<ApiPage> {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  url.searchParams.set("page", String(page));

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "x-api-key": apiKey,
    },
    ...(bypassCache
      ? { cache: "no-store" as const }
      : {
          next: {
            revalidate: CATALOG_REFRESH_SECONDS,
            tags: [MODEL_CACHE_TAG],
          },
        }),
  });

  if (!response.ok) {
    throw new ArtificialAnalysisError(response.status);
  }

  return {
    envelope: (await response.json()) as ApiEnvelope,
    responseDate: response.headers.get("date"),
  };
}

async function fetchLiveCatalog(
  apiKey: string,
  bypassCache: boolean,
): Promise<ModelCatalog> {
  const endpoint = getEndpoint();
  const firstPage = await fetchPage(apiKey, endpoint, 1, bypassCache);
  const totalPages = Math.min(firstPage.envelope.pagination.total_pages, 20);
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) =>
      fetchPage(apiKey, endpoint, index + 2, bypassCache),
    ),
  );

  const allRows = [firstPage, ...remainingPages].flatMap(
    (page) => page.envelope.data,
  );
  const deduplicated = Array.from(
    new Map(allRows.map((model) => [model.id, model])).values(),
  );
  const responseDate = firstPage.responseDate;
  const parsedResponseDate = responseDate ? new Date(responseDate) : null;
  const syncedAt =
    parsedResponseDate && !Number.isNaN(parsedResponseDate.getTime())
      ? parsedResponseDate.toISOString()
      : new Date().toISOString();

  return {
    models: deduplicated.map(normalizeModel),
    syncedAt,
    refreshIntervalMs: CATALOG_REFRESH_MS,
    indexVersion: firstPage.envelope.intelligence_index_version ?? null,
    source: {
      mode: "live",
      provider: "Artificial Analysis",
      tier: firstPage.envelope.tier,
      url: "https://artificialanalysis.ai/",
    },
  };
}

export async function getModelCatalog(
  options: GetModelCatalogOptions = {},
): Promise<ModelCatalog> {
  const apiKey = process.env.ARTIFICIAL_ANALYSIS_API_KEY?.trim();

  if (!apiKey) {
    const now = Date.now();
    if (
      catalogState.catalog?.source.mode === "demo" &&
      now < catalogState.validUntil
    ) {
      return catalogState.catalog;
    }

    const demoCatalog = getDemoCatalog();
    catalogState.catalog = demoCatalog;
    catalogState.validUntil = getNextCatalogRefreshBoundary(
      new Date(),
    ).getTime();
    return demoCatalog;
  }

  await ensureCatalogCacheLoaded();

  const now = Date.now();
  const boundaryExpired =
    catalogState.catalog !== null && now >= catalogState.validUntil;

  if (!options.force && catalogState.catalog && !boundaryExpired) {
    return catalogState.catalog;
  }

  if (catalogState.refreshPromise) return catalogState.refreshPromise;

  const bypassCache = options.force === true || boundaryExpired;
  catalogState.refreshPromise = (async () => {
    let nextCatalog: ModelCatalog;

    try {
      nextCatalog = await fetchLiveCatalog(apiKey, bypassCache);
      try {
        await writeCatalogCache(nextCatalog);
      } catch (error) {
        console.error("[Parallax] Model catalog cache write failed", {
          error: error instanceof Error ? error.name : "UnknownError",
        });
      }
    } catch (error) {
      const status =
        error instanceof ArtificialAnalysisError ? error.status : undefined;
      const notice = status
        ? `实时数据源返回 ${status}，暂时显示示例数据。请检查 API Key 与订阅层级。`
        : "实时数据源暂时不可用，当前显示示例数据。";

      console.error("[Parallax] Model catalog refresh failed", {
        status,
        error: error instanceof Error ? error.name : "UnknownError",
      });

      nextCatalog =
        catalogState.catalog ??
        getDemoCatalog(notice, status ? "apiError" : "unavailable", status);
    }

    catalogState.catalog = nextCatalog;
    catalogState.validUntil = getNextCatalogRefreshBoundary(new Date()).getTime();
    return nextCatalog;
  })().finally(() => {
    catalogState.refreshPromise = null;
  });

  return catalogState.refreshPromise;
}

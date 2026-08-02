import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import type { ModelCatalog } from "@/lib/models";

const CATALOG_CACHE_VERSION = 1;

export interface CatalogCacheSnapshot {
  version: typeof CATALOG_CACHE_VERSION;
  savedAt: string;
  catalog: ModelCatalog;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isModelCatalog(value: unknown): value is ModelCatalog {
  if (!isRecord(value)) return false;

  const source = value.source;
  return (
    Array.isArray(value.models) &&
    typeof value.syncedAt === "string" &&
    typeof value.refreshIntervalMs === "number" &&
    Number.isFinite(value.refreshIntervalMs) &&
    isRecord(source) &&
    (source.mode === "live" || source.mode === "demo") &&
    source.provider === "Artificial Analysis" &&
    typeof source.tier === "string" &&
    typeof source.url === "string"
  );
}

function isCatalogCacheSnapshot(value: unknown): value is CatalogCacheSnapshot {
  if (!isRecord(value) || value.version !== CATALOG_CACHE_VERSION) {
    return false;
  }

  return (
    typeof value.savedAt === "string" &&
    !Number.isNaN(Date.parse(value.savedAt)) &&
    isModelCatalog(value.catalog)
  );
}

export function getCatalogCachePath(): string {
  const configuredPath = process.env.PARALLAX_CATALOG_CACHE_PATH?.trim();
  return configuredPath
    ? path.resolve(configuredPath)
    : path.join(process.cwd(), "data", "model-catalog.json");
}

export async function readCatalogCache(
  cachePath = getCatalogCachePath(),
): Promise<CatalogCacheSnapshot | null> {
  try {
    const raw = await readFile(cachePath, "utf8");
    const parsed: unknown = JSON.parse(raw);
    return isCatalogCacheSnapshot(parsed) ? parsed : null;
  } catch (error) {
    const code = isRecord(error) && error.code;
    if (code !== "ENOENT") {
      console.warn("[Parallax] Model catalog cache read failed", {
        error: error instanceof Error ? error.name : "UnknownError",
      });
    }
    return null;
  }
}

export async function writeCatalogCache(
  catalog: ModelCatalog,
  cachePath = getCatalogCachePath(),
): Promise<void> {
  const directory = path.dirname(cachePath);
  const temporaryPath = `${cachePath}.${process.pid}.${Date.now()}.tmp`;
  const snapshot: CatalogCacheSnapshot = {
    version: CATALOG_CACHE_VERSION,
    savedAt: new Date().toISOString(),
    catalog,
  };

  await mkdir(directory, { recursive: true });

  try {
    await writeFile(temporaryPath, `${JSON.stringify(snapshot)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
    await rename(temporaryPath, cachePath);
  } finally {
    await unlink(temporaryPath).catch(() => undefined);
  }
}

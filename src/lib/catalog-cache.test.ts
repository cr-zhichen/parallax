import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  readCatalogCache,
  writeCatalogCache,
} from "@/lib/catalog-cache";
import type { ModelCatalog } from "@/lib/models";

const temporaryDirectories: string[] = [];

const catalog: ModelCatalog = {
  models: [],
  syncedAt: "2026-08-02T08:00:00.000Z",
  refreshIntervalMs: 28_800_000,
  indexVersion: 4.1,
  source: {
    mode: "live",
    provider: "Artificial Analysis",
    tier: "free",
    url: "https://artificialanalysis.ai/",
  },
};

async function makeCachePath(): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), "parallax-cache-"));
  temporaryDirectories.push(directory);
  return path.join(directory, "model-catalog.json");
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("catalog cache", () => {
  it("writes an atomic snapshot and restores it", async () => {
    const cachePath = await makeCachePath();

    await writeCatalogCache(catalog, cachePath);

    const restored = await readCatalogCache(cachePath);
    expect(restored).not.toBeNull();
    expect(restored?.catalog).toEqual(catalog);
    expect(restored?.version).toBe(1);
    expect(Number.isNaN(Date.parse(restored?.savedAt ?? ""))).toBe(false);
    expect(await readdir(path.dirname(cachePath))).toEqual([
      path.basename(cachePath),
    ]);
  });

  it("returns null for a corrupt or incompatible snapshot", async () => {
    const cachePath = await makeCachePath();

    await writeFile(cachePath, JSON.stringify({ version: 99 }), "utf8");

    expect(await readCatalogCache(cachePath)).toBeNull();
  });

  it("does not expose a partially written snapshot", async () => {
    const cachePath = await makeCachePath();

    await writeCatalogCache(catalog, cachePath);

    const persisted = JSON.parse(await readFile(cachePath, "utf8")) as {
      catalog: ModelCatalog;
    };
    expect(persisted.catalog.source.mode).toBe("live");
  });
});

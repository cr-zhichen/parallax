import { describe, expect, it } from "vitest";

import {
  getNextCatalogRefreshBoundary,
  millisecondsUntilNextCatalogRefresh,
} from "@/lib/refresh-schedule";

describe("catalog refresh schedule", () => {
  it("targets the next eight-hour boundary", () => {
    const now = new Date(2026, 7, 1, 7, 12, 45, 500);
    const next = getNextCatalogRefreshBoundary(now);

    expect(next.getHours()).toBe(8);
    expect(next.getMinutes()).toBe(0);
    expect(next.getSeconds()).toBe(0);
    expect(millisecondsUntilNextCatalogRefresh(now)).toBe(2_834_500);
  });

  it("moves to the next day after the final boundary", () => {
    const now = new Date(2026, 7, 1, 23, 59, 59, 250);
    const next = getNextCatalogRefreshBoundary(now);

    expect(next.getDate()).toBe(2);
    expect(next.getHours()).toBe(0);
    expect(millisecondsUntilNextCatalogRefresh(now)).toBe(750);
  });

  it("does not drift at an exact boundary", () => {
    const now = new Date(2026, 7, 1, 16, 0, 0, 0);
    const next = getNextCatalogRefreshBoundary(now);

    expect(next.getHours()).toBe(0);
    expect(next.getDate()).toBe(2);
    expect(millisecondsUntilNextCatalogRefresh(now)).toBe(28_800_000);
  });
});

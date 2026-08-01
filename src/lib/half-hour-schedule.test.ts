import { describe, expect, it } from "vitest";

import {
  getNextHalfHourBoundary,
  millisecondsUntilNextHalfHour,
} from "@/lib/half-hour-schedule";

describe("half-hour schedule", () => {
  it("targets minute 30 when the current minute is below 30", () => {
    const now = new Date(2026, 7, 1, 10, 12, 45, 500);
    const next = getNextHalfHourBoundary(now);

    expect(next.getHours()).toBe(10);
    expect(next.getMinutes()).toBe(30);
    expect(next.getSeconds()).toBe(0);
    expect(millisecondsUntilNextHalfHour(now)).toBe(1_034_500);
  });

  it("targets the next hour when the current minute is 30 or later", () => {
    const atBoundary = new Date(2026, 7, 1, 10, 30, 0, 0);
    const next = getNextHalfHourBoundary(atBoundary);

    expect(next.getHours()).toBe(11);
    expect(next.getMinutes()).toBe(0);
    expect(millisecondsUntilNextHalfHour(atBoundary)).toBe(1_800_000);
  });

  it("does not drift near the next hour", () => {
    const now = new Date(2026, 7, 1, 10, 59, 59, 250);

    expect(millisecondsUntilNextHalfHour(now)).toBe(750);
  });
});

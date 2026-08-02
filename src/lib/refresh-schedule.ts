import { CATALOG_REFRESH_HOURS } from "@/lib/models";

export function getNextCatalogRefreshBoundary(now: Date): Date {
  const next = new Date(now.getTime());
  const nextBoundaryHour =
    (Math.floor(now.getHours() / CATALOG_REFRESH_HOURS) + 1) *
    CATALOG_REFRESH_HOURS;

  next.setHours(nextBoundaryHour, 0, 0, 0);
  return next;
}

export function millisecondsUntilNextCatalogRefresh(now: Date): number {
  return Math.max(
    0,
    getNextCatalogRefreshBoundary(now).getTime() - now.getTime(),
  );
}

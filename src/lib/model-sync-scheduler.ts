import "server-only";

import { getModelCatalog } from "@/lib/artificial-analysis";
import {
  getNextHalfHourBoundary,
  millisecondsUntilNextHalfHour,
} from "@/lib/half-hour-schedule";

interface SchedulerState {
  started: boolean;
  timer: ReturnType<typeof setTimeout> | null;
  nextRunAt: string | null;
}

const schedulerGlobal = globalThis as typeof globalThis & {
  __parallaxModelSyncScheduler?: SchedulerState;
};

const schedulerState =
  schedulerGlobal.__parallaxModelSyncScheduler ??
  (schedulerGlobal.__parallaxModelSyncScheduler = {
    started: false,
    timer: null,
    nextRunAt: null,
  });

function allowProcessToExit(timer: ReturnType<typeof setTimeout>) {
  if (typeof timer === "object" && "unref" in timer) {
    timer.unref();
  }
}

function scheduleNextRefresh() {
  const now = new Date();
  const nextRun = getNextHalfHourBoundary(now);
  const delay = millisecondsUntilNextHalfHour(now);

  schedulerState.nextRunAt = nextRun.toISOString();
  schedulerState.timer = setTimeout(async () => {
    schedulerState.timer = null;

    try {
      const catalog = await getModelCatalog({ force: true });
      console.info("[Parallax] Scheduled model refresh completed", {
        modelCount: catalog.models.length,
        sourceMode: catalog.source.mode,
        syncedAt: catalog.syncedAt,
      });
    } catch (error) {
      console.error("[Parallax] Scheduled model refresh failed", {
        error: error instanceof Error ? error.name : "UnknownError",
      });
    } finally {
      scheduleNextRefresh();
    }
  }, delay);

  allowProcessToExit(schedulerState.timer);
}

export function startModelSyncScheduler() {
  if (schedulerState.started) return;

  schedulerState.started = true;
  scheduleNextRefresh();

  console.info("[Parallax] Backend model refresh scheduled", {
    cadence: "hourly at :00 and :30",
    nextRunAt: schedulerState.nextRunAt,
  });
}

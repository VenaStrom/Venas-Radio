import "server-only";
import { setInterval } from "node:timers";
import { prefetchFollowedProgramEpisodes } from "@/lib/episode-prefetch";

const PREFETCH_INTERVAL_MS = 15 * 60 * 1000;

type SchedulerState = {
  interval?: NodeJS.Timeout;
  isRunning?: boolean;
};

const state = globalThis as typeof globalThis & { __episodePrefetchScheduler?: SchedulerState };

export function ensureEpisodePrefetchScheduler() {
  if (state.__episodePrefetchScheduler?.interval) return;

  const schedulerState: SchedulerState = state.__episodePrefetchScheduler ?? {};
  state.__episodePrefetchScheduler = schedulerState;

  const run = async () => {
    if (schedulerState.isRunning) return;
    schedulerState.isRunning = true;
    try {
      await prefetchFollowedProgramEpisodes();
    }
    catch (error) {
      console.warn("Episode prefetch scheduler failed", error);
    }
    finally {
      schedulerState.isRunning = false;
    }
  };

  void run();
  schedulerState.interval = setInterval(run, PREFETCH_INTERVAL_MS);
}

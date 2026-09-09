import { create } from "zustand";
import * as alertsService from "../services/alertsService";
import { UnauthorizedError, redirectToLogin } from "../services/http";

type AlertStatsState = {
  stats: alertsService.AlertStats | null;
  error: string | null;
  load: () => Promise<void>;
  applyDelta: (activeDelta: number, closedDelta: number) => void;
};

export const useAlertStatsStore = create<AlertStatsState>((set) => ({
  stats: null,
  error: null,

  load: async () => {
    try {
      const stats = await alertsService.getAlertStats();
      set({ stats, error: null });
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        redirectToLogin();
        return;
      }
      set({ error: e instanceof Error ? e.message : "Failed to load alert stats" });
    }
  },

  applyDelta: (activeDelta, closedDelta) => {
    set((s) =>
      s.stats
        ? { stats: { ...s.stats, active: s.stats.active + activeDelta, closed: s.stats.closed + closedDelta } }
        : s,
    );
  },
}));

// Module-level guard: the store is a singleton, so this ensures only one
// polling interval ever runs regardless of how many components mount and
// call this (avoids the duplicate polling DashboardShell and DashboardView
// used to do independently against the same endpoint).
let pollingStarted = false;
export function ensureAlertStatsPolling() {
  if (pollingStarted) return;
  pollingStarted = true;
  const { load } = useAlertStatsStore.getState();
  load();
  setInterval(load, 10000);
}

import { create } from "zustand";
import debounce from "lodash/debounce";
import * as alertsService from "../services/alertsService";
import { UnauthorizedError, redirectToLogin } from "../services/http";
import { useAlertStatsStore } from "./useAlertStatsStore";

type AlertsState = {
  latestAlerts: alertsService.Alert[];
  pagedAlerts: alertsService.Alert[];
  pageCursors: (string | undefined)[];
  pageIndex: number;
  nextCursor: string | null;
  hasMore: boolean;
  search: string;
  selected: alertsService.Alert | null;
  requestSeq: number;
  resultVersion: number;
  error: string | null;

  loadLatest: () => Promise<void>;
  loadPage: (cursor?: string, search?: string) => Promise<void>;
  enterAlertsPage: () => void;
  setSearch: (value: string) => void;
  goNext: () => Promise<void>;
  goPrev: () => Promise<void>;
  select: (alert: alertsService.Alert | null) => void;
  close: (id: string) => Promise<void>;
};

function errorMessage(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  latestAlerts: [],
  pagedAlerts: [],
  pageCursors: [undefined],
  pageIndex: 0,
  nextCursor: null,
  hasMore: false,
  search: "",
  selected: null,
  requestSeq: 0,
  resultVersion: 0,
  error: null,

  loadLatest: async () => {
    try {
      const data = await alertsService.getAlerts({ limit: 12 });
      set({ latestAlerts: data.alerts, error: null });
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        redirectToLogin();
        return;
      }
      set({ error: errorMessage(e, "Failed to load alerts") });
    }
  },

  // Every call is tagged with a monotonically increasing sequence number, and
  // a response only gets applied if it's still the most recent request in
  // flight. Without this, a slow earlier request (e.g. the initial unfiltered
  // page load) can resolve after a newer one (e.g. a search) and silently
  // clobber it with stale results.
  loadPage: async (cursor, search) => {
    const seq = get().requestSeq + 1;
    set({ requestSeq: seq });
    try {
      const data = await alertsService.getAlerts({ limit: 12, cursor, search });
      if (get().requestSeq !== seq) return;
      // Bump resultVersion so the UI can force a clean remount of the alert
      // list on every load — AnimatePresence can leave stale nodes behind
      // when the new and old children sets partially overlap in key (e.g. a
      // search result that happens to include an alert from the previous,
      // unfiltered page).
      set((s) => ({ pagedAlerts: data.alerts, nextCursor: data.nextCursor, hasMore: data.hasMore, resultVersion: s.resultVersion + 1, error: null }));
    } catch (e) {
      if (get().requestSeq !== seq) return;
      if (e instanceof UnauthorizedError) {
        redirectToLogin();
        return;
      }
      set({ error: errorMessage(e, "Failed to load alerts") });
    }
  },

  enterAlertsPage: () => {
    set({ pageCursors: [undefined], pageIndex: 0, search: "" });
    get().loadPage(undefined, "");
  },

  setSearch: (value) => {
    set({ search: value, pageCursors: [undefined], pageIndex: 0 });
    debouncedSearchLoad(value);
  },

  goNext: async () => {
    const { hasMore, nextCursor, pageCursors, pageIndex, search } = get();
    if (!hasMore) return;
    const cursor = nextCursor ?? undefined;
    await get().loadPage(cursor, search);
    set({ pageCursors: [...pageCursors.slice(0, pageIndex + 1), cursor], pageIndex: pageIndex + 1 });
  },

  goPrev: async () => {
    const { pageIndex, pageCursors, search } = get();
    if (pageIndex === 0) return;
    const newIndex = pageIndex - 1;
    await get().loadPage(pageCursors[newIndex], search);
    set({ pageIndex: newIndex });
  },

  select: (alert) => set({ selected: alert }),

  close: async (id) => {
    const { latestAlerts, pagedAlerts } = get();
    set({
      latestAlerts: latestAlerts.filter((a) => a.id !== id),
      pagedAlerts: pagedAlerts.filter((a) => a.id !== id),
      selected: null,
    });
    useAlertStatsStore.getState().applyDelta(-1, 1);
    try {
      await alertsService.closeAlert(id);
      set({ error: null });
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        redirectToLogin();
        return;
      }
      // The close failed server-side — revert the optimistic update so the
      // UI doesn't claim an alert is closed when it isn't.
      set({ latestAlerts, pagedAlerts, error: errorMessage(e, "Failed to close alert") });
      useAlertStatsStore.getState().applyDelta(1, -1);
    }
  },
}));

const debouncedSearchLoad = debounce((search: string) => {
  useAlertsStore.getState().loadPage(undefined, search);
}, 300);

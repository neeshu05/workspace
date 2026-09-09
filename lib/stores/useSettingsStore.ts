import { create } from "zustand";
import debounce from "lodash/debounce";
import * as settingsService from "../services/settingsService";
import { UnauthorizedError, redirectToLogin } from "../services/http";

type SettingsState = {
  liveTrackingPaused: boolean | null;
  error: string | null;
  load: () => Promise<void>;
  toggle: () => void;
};

function errorMessage(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

const debouncedPatch = debounce((value: boolean) => {
  settingsService
    .updateSettings({ liveTrackingPaused: value })
    .then(() => useSettingsStore.setState({ error: null }))
    .catch((e) => {
      if (e instanceof UnauthorizedError) {
        redirectToLogin();
        return;
      }
      useSettingsStore.setState({ error: errorMessage(e, "Failed to update settings") });
    });
}, 400);

export const useSettingsStore = create<SettingsState>((set, get) => ({
  liveTrackingPaused: null,
  error: null,

  load: async () => {
    try {
      const settings = await settingsService.getSettings();
      set({ liveTrackingPaused: settings.liveTrackingPaused, error: null });
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        redirectToLogin();
        return;
      }
      set({ error: errorMessage(e, "Failed to load settings") });
    }
  },

  toggle: () => {
    const next = !get().liveTrackingPaused;
    set({ liveTrackingPaused: next });
    debouncedPatch(next);
  },
}));

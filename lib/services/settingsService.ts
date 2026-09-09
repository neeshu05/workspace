import { getJson, patchJson } from "./http";

export type Settings = { liveTrackingPaused: boolean };

export function getSettings() {
  return getJson<Settings>("/api/settings");
}

export function updateSettings(data: Partial<Settings>) {
  return patchJson<Settings>("/api/settings", data);
}

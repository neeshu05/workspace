export type ZoneRow = { zone: string; detail: string; score: string };

const ZONES = ["Receiving A", "Cold storage C", "High-bay D"];
const INVENTORY_DETAIL = ["1,284 units", "2,091 units", "238 units"];
const ANALYTICS_SCORE = ["98.9%", "97.8%", "99.2%"];
const INVENTORY_FULL = ["76% full", "64% full", "32% full"];

export function buildZoneRows(page: string): ZoneRow[] {
  const isAnalytics = page === "analytics";
  return ZONES.map((zone, i) => ({
    zone,
    detail: isAnalytics ? "Live operational zone" : INVENTORY_DETAIL[i],
    score: isAnalytics ? ANALYTICS_SCORE[i] : INVENTORY_FULL[i],
  }));
}

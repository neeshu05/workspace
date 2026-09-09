import { getJson } from "./http";

export type DerivedAlert = { level: "WARN" | "CRITICAL"; metric: string; message: string };
export type WindowStats = { label: string; averageTemperature: number; averageHumidity: number; averageThroughput: number };

export type Summary = {
  ordersToday: number;
  fulfillmentRate: number;
  activePickers: number;
  dockUtilization: number;
  trend: number[];
  window: WindowStats;
  trendDelta: { pct: number; previousTrend: number[] };
  derivedAlerts: DerivedAlert[];
  updatedAt: string;
};

export function getSummary() {
  return getJson<Summary>("/api/dashboard/summary");
}

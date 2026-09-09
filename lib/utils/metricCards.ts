import { LiveSensorReading } from "../hooks/useLiveSensorStream";
import { Summary } from "../services/dashboardService";

export const TEMP_NOTES: Record<string, string> = {
  OK: "Within cold-chain range",
  WARN: "Above recommended range",
  CRITICAL: "Critical — immediate attention required",
};

export type MetricCard = [label: string, value: string, note: string];

export function buildMetricCards(live: LiveSensorReading, summary: Summary | null): MetricCard[] {
  return [
    ["Zone C temperature", `${live.temperature}°C`, TEMP_NOTES[live.status] ?? "Within cold-chain range"],
    ["Ambient humidity", `${live.humidity}%`, "Live floor sensor reading"],
    ["Package throughput", `${live.throughput}/hr`, live.event.replace("_", " ").toLowerCase()],
    ["Orders processed", summary?.ordersToday.toLocaleString() ?? "—", "↑ 8.2% vs. last shift"],
  ];
}

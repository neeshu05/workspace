import { Summary } from "../services/dashboardService";
import { StatLineData } from "./statLine";

export function buildWindowStats(summary: Summary): StatLineData[] {
  const { window } = summary;
  return [
    { label: "Avg temperature", value: `${window.averageTemperature}°C` },
    { label: "Avg humidity", value: `${window.averageHumidity}%` },
    { label: "Avg throughput", value: `${window.averageThroughput}/hr` },
  ];
}

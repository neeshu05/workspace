import { Summary } from "../services/dashboardService";
import { StatLineData } from "./statLine";

export function buildShiftHealthStats(summary: Summary | null): StatLineData[] {
  return [
    { label: "Active pickers", value: `${summary?.activePickers ?? 42} / 48` },
    { label: "Dock utilization", value: `${summary?.dockUtilization ?? 76}%` },
  ];
}

import { Summary } from "../../../lib/services/dashboardService";

export default function ShiftHealthPanel({ summary }: { summary: Summary | null }) {
  return (
    <article className="panel status-panel">
      <h3>Shift health</h3>
      <div className="score">
        <b>{summary?.fulfillmentRate ?? 98.4}%</b>
        <span>Fulfillment accuracy</span>
      </div>
      <div className="stat-line">
        <span>Active pickers</span>
        <b>{summary?.activePickers ?? 42} / 48</b>
      </div>
      <div className="stat-line">
        <span>Dock utilization</span>
        <b>{summary?.dockUtilization ?? 76}%</b>
      </div>
    </article>
  );
}

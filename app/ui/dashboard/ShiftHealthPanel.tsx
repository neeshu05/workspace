import { Summary } from "../../../lib/services/dashboardService";
import { buildShiftHealthStats } from "../../../lib/utils/shiftHealth";
import StatLine from "../shared/StatLine";

export default function ShiftHealthPanel({ summary }: { summary: Summary | null }) {
  const stats = buildShiftHealthStats(summary);

  return (
    <article className="panel status-panel">
      <h3>Shift health</h3>
      <div className="score">
        <b>{summary?.fulfillmentRate ?? 98.4}%</b>
        <span>Fulfillment accuracy</span>
      </div>
      {stats.map((s) => (
        <StatLine key={s.label} label={s.label} value={s.value} />
      ))}
    </article>
  );
}

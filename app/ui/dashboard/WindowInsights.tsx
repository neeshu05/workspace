import { Summary } from "../../../lib/services/dashboardService";
import { buildWindowStats } from "../../../lib/utils/windowInsights";
import StatLine from "../shared/StatLine";

export default function WindowInsights({ summary }: { summary: Summary | null }) {
  if (!summary?.window) return null;
  const { trendDelta, derivedAlerts } = summary;
  const positive = trendDelta.pct >= 0;
  const windowStats = buildWindowStats(summary);

  return (
    <article className="panel window-insights">
      <h3>{summary.window.label} window</h3>
      {windowStats.map((s) => (
        <StatLine key={s.label} label={s.label} value={s.value} />
      ))}
      <StatLine label="Trend vs previous window" value={`${positive ? "+" : ""}${trendDelta.pct}%`} positive={positive} />
      {derivedAlerts.length > 0 && (
        <div className="derived-alerts">
          {derivedAlerts.map((a, i) => (
            <p key={i} className={`derived-alert derived-alert-${a.level.toLowerCase()}`}>
              {a.message}
            </p>
          ))}
        </div>
      )}
    </article>
  );
}

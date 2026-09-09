import { Summary } from "../../../lib/services/dashboardService";

export default function WindowInsights({ summary }: { summary: Summary | null }) {
  if (!summary?.window) return null;
  const { window, trendDelta, derivedAlerts } = summary;
  const positive = trendDelta.pct >= 0;

  return (
    <article className="panel window-insights">
      <h3>{window.label} window</h3>
      <div className="stat-line">
        <span>Avg temperature</span>
        <b>{window.averageTemperature}°C</b>
      </div>
      <div className="stat-line">
        <span>Avg humidity</span>
        <b>{window.averageHumidity}%</b>
      </div>
      <div className="stat-line">
        <span>Avg throughput</span>
        <b>{window.averageThroughput}/hr</b>
      </div>
      <div className="stat-line">
        <span>Trend vs previous window</span>
        <b className={positive ? "positive" : ""}>
          {positive ? "+" : ""}
          {trendDelta.pct}%
        </b>
      </div>
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

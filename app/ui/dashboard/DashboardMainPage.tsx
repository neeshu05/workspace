"use client";
import Title from "../shared/Title";
import ErrorState from "../shared/ErrorState";
import MetricCards from "./MetricCards";
import FulfillmentChart from "./FulfillmentChart";
import ShiftHealthPanel from "./ShiftHealthPanel";
import WindowInsights from "./WindowInsights";
import ZoneTable from "./ZoneTable";
import AlertsPanel from "./AlertsPanel";
import { useDashboardSummary } from "../../../lib/hooks/useDashboardSummary";
import { useLiveSensorStream } from "../../../lib/hooks/useLiveSensorStream";

export default function DashboardMainPage({ page, title, subtitle }: { page: string; title: string; subtitle: string }) {
  const { summary, error, reload } = useDashboardSummary();
  const live = useLiveSensorStream();
  const showMetrics = page !== "alerts";
  const showZoneTable = page === "analytics" || page === "inventory";
  const showAlertsPanel = page !== "analytics" && page !== "inventory";

  return (
    <section className="content">
      <Title title={title} subtitle={subtitle} updated={summary?.updatedAt} />
      {showMetrics &&
        (!summary && error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <>
            <MetricCards live={live} summary={summary} />
            <div className="two-col">
              <FulfillmentChart page={page} trend={summary?.trend} />
              <ShiftHealthPanel summary={summary} />
            </div>
            <WindowInsights summary={summary} />
          </>
        ))}
      {showZoneTable && <ZoneTable page={page} />}
      {showAlertsPanel && <AlertsPanel variant={page === "alerts" ? "full" : "widget"} />}
    </section>
  );
}

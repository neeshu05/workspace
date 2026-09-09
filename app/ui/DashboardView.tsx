"use client";
import { useEffect } from "react";
import Title from "./shared/Title";
import ErrorState from "./shared/ErrorState";
import MetricCards from "./dashboard/MetricCards";
import FulfillmentChart from "./dashboard/FulfillmentChart";
import ShiftHealthPanel from "./dashboard/ShiftHealthPanel";
import WindowInsights from "./dashboard/WindowInsights";
import ZoneTable from "./dashboard/ZoneTable";
import AlertsPanel from "./dashboard/AlertsPanel";
import LiveMonitoringPanel from "./settings/LiveMonitoringPanel";
import PollingIntervalPanel from "./settings/PollingIntervalPanel";
import ProfileEditForm from "./settings/ProfileEditForm";
import ProfileSummaryCard from "./profile/ProfileSummaryCard";
import ActivityFeed from "./profile/ActivityFeed";
import { useDashboardSummary } from "../../lib/hooks/useDashboardSummary";
import { useLiveSensorStream } from "../../lib/hooks/useLiveSensorStream";
import { useSettingsStore } from "../../lib/stores/useSettingsStore";
import { useProfileStore } from "../../lib/stores/useProfileStore";

const titles: Record<string, [string, string]> = {
  overview: ["Good morning, Maya.", "Here’s what’s happening across Apex Fulfillment Center."],
  analytics: ["Operational analytics", "Compare live output with shift-level performance."],
  alerts: ["Alerts & events", "Review and resolve warehouse exceptions."],
  inventory: ["Inventory flow", "Health and movement across active storage zones."],
  settings: ["Workspace settings", "Tune your real-time monitoring preferences."],
  profile: ["Your operator profile", "Session details and access controls."],
};

export default function DashboardView({ page }: { page: string }) {
  const loadSettings = useSettingsStore((s) => s.load);
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const profile = useProfileStore((s) => s.profile);
  const profileError = useProfileStore((s) => s.error);
  const loadProfile = useProfileStore((s) => s.load);
  useEffect(() => {
    if (page === "profile" || page === "settings") loadProfile();
  }, [page, loadProfile]);

  const [title, subtitle] = titles[page];

  if (page === "settings") {
    return (
      <section className="content">
        <Title title={title} subtitle={subtitle} />
        <div className="settings-grid">
          <LiveMonitoringPanel />
          <PollingIntervalPanel />
        </div>
        <ProfileEditForm />
      </section>
    );
  }

  if (page === "profile") {
    return (
      <section className="content">
        <Title title={title} subtitle={subtitle} />
        {!profile && profileError ? (
          <ErrorState message={profileError} onRetry={loadProfile} />
        ) : (
          <>
            <ProfileSummaryCard profile={profile} />
            <ActivityFeed activity={profile?.activity ?? []} />
          </>
        )}
      </section>
    );
  }

  return <DashboardMainPage page={page} title={title} subtitle={subtitle} />;
}

function DashboardMainPage({ page, title, subtitle }: { page: string; title: string; subtitle: string }) {
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

import Title from "../shared/Title";
import LiveMonitoringPanel from "./LiveMonitoringPanel";
import PollingIntervalPanel from "./PollingIntervalPanel";
import ProfileEditForm from "./ProfileEditForm";

export default function SettingsPage({ title, subtitle }: { title: string; subtitle: string }) {
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

"use client";
import { useSettingsStore } from "../../../lib/stores/useSettingsStore";
import ToggleRow from "../shared/ToggleRow";

export default function LiveMonitoringPanel() {
  const paused = useSettingsStore((s) => s.liveTrackingPaused);
  const error = useSettingsStore((s) => s.error);
  const toggle = useSettingsStore((s) => s.toggle);

  return (
    <article className="panel">
      <h3>Live monitoring</h3>
      <p>Pause the floor event stream when reviewing reports.</p>
      <ToggleRow label="Live event stream" on={!paused} onClick={toggle} disabled={paused === null} />
      <ToggleRow label="Email alert digest" on />
      {error && <p className="inline-error">{error}</p>}
    </article>
  );
}

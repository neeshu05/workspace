"use client";
import { useSettingsStore } from "../../../lib/stores/useSettingsStore";

export default function LiveMonitoringPanel() {
  const paused = useSettingsStore((s) => s.liveTrackingPaused);
  const error = useSettingsStore((s) => s.error);
  const toggle = useSettingsStore((s) => s.toggle);

  return (
    <article className="panel">
      <h3>Live monitoring</h3>
      <p>Pause the floor event stream when reviewing reports.</p>
      <label className="toggle-row">
        Live event stream{" "}
        <button className={`toggle ${paused ? "" : "on"}`} onClick={toggle} disabled={paused === null}>
          <span />
        </button>
      </label>
      <label className="toggle-row">
        Email alert digest{" "}
        <button className="toggle on">
          <span />
        </button>
      </label>
      {error && <p className="inline-error">{error}</p>}
    </article>
  );
}

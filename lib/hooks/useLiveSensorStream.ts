import { useEffect, useState } from "react";
import { useSettingsStore } from "../stores/useSettingsStore";

export type LiveSensorReading = {
  temperature: number;
  humidity: number;
  throughput: number;
  status: string;
  event: string;
  timestamp: string;
};

const DEFAULT_READING: LiveSensorReading = {
  temperature: 4.2,
  humidity: 48,
  throughput: 184,
  status: "OK",
  event: "SENSOR_UPDATE",
  timestamp: new Date().toISOString(),
};

export function useLiveSensorStream() {
  const paused = useSettingsStore((s) => s.liveTrackingPaused);
  const [live, setLive] = useState<LiveSensorReading>(DEFAULT_READING);

  useEffect(() => {
    if (paused) return;
    const source = new EventSource("/api/dashboard/stream");
    source.onmessage = (e) => setLive(JSON.parse(e.data));
    return () => source.close();
  }, [paused]);

  return live;
}

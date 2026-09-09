import { generateReading } from "./liveMetrics";

const BASE_TREND = [82, 76, 88, 71, 93, 86, 90];
const WINDOW_SAMPLE_SIZE = 6;

export type DerivedAlert = { level: "WARN" | "CRITICAL"; metric: string; message: string };

export type WindowStats = {
  label: string;
  averageTemperature: number;
  averageHumidity: number;
  averageThroughput: number;
};

export type Summary = {
  ordersToday: number;
  fulfillmentRate: number;
  activePickers: number;
  dockUtilization: number;
  trend: number[];
  window: WindowStats;
  trendDelta: { pct: number; previousTrend: number[] };
  derivedAlerts: DerivedAlert[];
  updatedAt: string;
};

function buildTrend() {
  return BASE_TREND.map((v) => v + Math.floor(Math.random() * 8) - 4);
}

function sampleWindow(): WindowStats {
  // Averages a fresh batch of dummy readings — structurally distinct from
  // the raw instantaneous SSE payload: this is an aggregate over a window,
  // not a single live tick. Occasionally biases the batch warm/humid/slow so
  // the threshold-derived alerts below are actually observable sometimes,
  // rather than being smoothed away to nothing by averaging.
  const trendingWarm = Math.random() < 0.3;
  const trendingHumid = Math.random() < 0.15;
  const trendingSlow = Math.random() < 0.15;

  const samples = Array.from({ length: WINDOW_SAMPLE_SIZE }, () => {
    const reading = generateReading(null);
    return {
      temperature: trendingWarm ? reading.temperature + 0.7 + Math.random() * 0.6 : reading.temperature,
      humidity: trendingHumid ? reading.humidity + 12 : reading.humidity,
      throughput: trendingSlow ? Math.max(90, reading.throughput - 60) : reading.throughput,
    };
  });
  const avg = (key: "temperature" | "humidity" | "throughput") => samples.reduce((sum, s) => sum + s[key], 0) / samples.length;
  return {
    label: "Last 15 min",
    averageTemperature: +avg("temperature").toFixed(2),
    averageHumidity: Math.round(avg("humidity")),
    averageThroughput: Math.round(avg("throughput")),
  };
}

function deriveAlerts(window: WindowStats): DerivedAlert[] {
  const alerts: DerivedAlert[] = [];
  if (window.averageTemperature > 5.2) {
    alerts.push({ level: "CRITICAL", metric: "temperature", message: `Zone C average temperature ${window.averageTemperature}°C is critical (above 5.2°C)` });
  } else if (window.averageTemperature > 4.6) {
    alerts.push({ level: "WARN", metric: "temperature", message: `Zone C average temperature ${window.averageTemperature}°C is above the 4.6°C threshold` });
  }
  if (window.averageHumidity < 40 || window.averageHumidity > 58) {
    alerts.push({ level: "WARN", metric: "humidity", message: `Average humidity ${window.averageHumidity}% is outside the 40-58% target range` });
  }
  if (window.averageThroughput < 150) {
    alerts.push({ level: "WARN", metric: "throughput", message: `Average throughput ${window.averageThroughput}/hr is below the 150/hr target` });
  }
  return alerts;
}

export function buildSummary(): Summary {
  const shift = Math.floor(Math.random() * 5) - 2;
  const trend = buildTrend();
  const previousTrend = buildTrend();
  const trendSum = trend.reduce((a, b) => a + b, 0);
  const previousTrendSum = previousTrend.reduce((a, b) => a + b, 0);
  const trendDeltaPct = +(((trendSum - previousTrendSum) / previousTrendSum) * 100).toFixed(1);

  const window = sampleWindow();

  return {
    ordersToday: 1284 + shift * 9,
    fulfillmentRate: +(98.4 + shift / 10).toFixed(1),
    activePickers: 42 + shift,
    dockUtilization: 76 + shift * 2,
    trend,
    window,
    trendDelta: { pct: trendDeltaPct, previousTrend },
    derivedAlerts: deriveAlerts(window),
    updatedAt: new Date().toISOString(),
  };
}

export type LiveStatus = "OK" | "WARN" | "CRITICAL";
export type LiveEvent = "UPDATE" | "ALERT" | "RECOVERY";

export type LiveReading = {
  temperature: number;
  humidity: number;
  throughput: number;
  status: LiveStatus;
  event: LiveEvent;
  timestamp: string;
};

const WARN_THRESHOLD = 4.6;
const CRITICAL_THRESHOLD = 5.2;

function statusForTemperature(temperature: number): LiveStatus {
  if (temperature > CRITICAL_THRESHOLD) return "CRITICAL";
  if (temperature > WARN_THRESHOLD) return "WARN";
  return "OK";
}

// previousStatus lets the caller detect a state transition (entering a bad
// state = ALERT, returning to OK = RECOVERY); pass null for a one-off sample
// with no transition context, which always yields "UPDATE".
export function generateReading(previousStatus: LiveStatus | null): LiveReading {
  const variance = () => Math.round((Math.random() - 0.5) * 12);
  const temperature = +(4.2 + (Math.random() - 0.5) * 1.4).toFixed(1);
  const humidity = 48 + variance();
  const throughput = 184 + variance() * 3;
  const status = statusForTemperature(temperature);

  let event: LiveEvent = "UPDATE";
  if (previousStatus !== null && status !== previousStatus) {
    event = status === "OK" ? "RECOVERY" : "ALERT";
  }

  return { temperature, humidity, throughput, status, event, timestamp: new Date().toISOString() };
}

"use client";
import { motion } from "framer-motion";
import AnimatedValue from "../shared/AnimatedValue";
import { LiveSensorReading } from "../../../lib/hooks/useLiveSensorStream";
import { Summary } from "../../../lib/services/dashboardService";

const TEMP_NOTES: Record<string, string> = {
  OK: "Within cold-chain range",
  WARN: "Above recommended range",
  CRITICAL: "Critical — immediate attention required",
};

export default function MetricCards({ live, summary }: { live: LiveSensorReading; summary: Summary | null }) {
  const cards: [string, string, string][] = [
    ["Zone C temperature", `${live.temperature}°C`, TEMP_NOTES[live.status] ?? "Within cold-chain range"],
    ["Ambient humidity", `${live.humidity}%`, "Live floor sensor reading"],
    ["Package throughput", `${live.throughput}/hr`, live.event.replace("_", " ").toLowerCase()],
    ["Orders processed", summary?.ordersToday.toLocaleString() ?? "—", "↑ 8.2% vs. last shift"],
  ];

  return (
    <div className="metric-grid">
      {cards.map(([label, value, note]) => {
        const isTemp = label === "Zone C temperature";
        const iconClass = isTemp ? (live.status === "CRITICAL" ? "critical" : live.status === "WARN" ? "warn" : "good") : "good";
        const shouldPulse = isTemp && live.status !== "OK";
        return (
          <article className="metric-card" key={label}>
            <span>
              {label}
              <motion.i
                className={iconClass}
                animate={shouldPulse ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                transition={shouldPulse ? { duration: 1, repeat: Infinity } : { duration: 0.2 }}
              />
            </span>
            <AnimatedValue value={value ?? "—"} />
            <small>{note}</small>
          </article>
        );
      })}
    </div>
  );
}

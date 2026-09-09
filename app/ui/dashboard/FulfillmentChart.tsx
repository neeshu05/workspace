"use client";
import { motion } from "framer-motion";
import { DEFAULT_TREND } from "../../../lib/utils/trend";

export default function FulfillmentChart({ page, trend }: { page: string; trend?: number[] }) {
  return (
    <article className="panel chart">
      <div className="panel-head">
        <div>
          <h3>{page === "inventory" ? "Inbound inventory velocity" : "Fulfillment activity"}</h3>
          <p>Rolling hourly volume</p>
        </div>
        <button>Last 7 hours⌄</button>
      </div>
      <div className="bars">
        {(trend ?? DEFAULT_TREND).map((h, i) => (
          <div key={i}>
            <motion.span initial={false} animate={{ height: `${h}%` }} transition={{ type: "spring", stiffness: 120, damping: 18 }} />
            <small>{8 + i}:00</small>
          </div>
        ))}
      </div>
    </article>
  );
}

"use client";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useAlertsStore } from "../../../lib/stores/useAlertsStore";
import { useAlertStatsStore } from "../../../lib/stores/useAlertStatsStore";
import AlertModal from "./AlertModal";
import ErrorState from "../shared/ErrorState";

export default function AlertsPanel({ variant }: { variant: "widget" | "full" }) {
  const latestAlerts = useAlertsStore((s) => s.latestAlerts);
  const pagedAlerts = useAlertsStore((s) => s.pagedAlerts);
  const pageIndex = useAlertsStore((s) => s.pageIndex);
  const resultVersion = useAlertsStore((s) => s.resultVersion);
  const hasMore = useAlertsStore((s) => s.hasMore);
  const search = useAlertsStore((s) => s.search);
  const selected = useAlertsStore((s) => s.selected);
  const loadLatest = useAlertsStore((s) => s.loadLatest);
  const enterAlertsPage = useAlertsStore((s) => s.enterAlertsPage);
  const setSearch = useAlertsStore((s) => s.setSearch);
  const goNext = useAlertsStore((s) => s.goNext);
  const goPrev = useAlertsStore((s) => s.goPrev);
  const select = useAlertsStore((s) => s.select);
  const close = useAlertsStore((s) => s.close);
  const error = useAlertsStore((s) => s.error);
  const stats = useAlertStatsStore((s) => s.stats);

  useEffect(() => {
    if (variant === "widget") {
      loadLatest();
      const timer = setInterval(loadLatest, 10000);
      return () => clearInterval(timer);
    }
    enterAlertsPage();
  }, [variant]);

  const list = variant === "widget" ? latestAlerts.slice(0, 5) : pagedAlerts;
  const retry = variant === "widget" ? loadLatest : enterAlertsPage;

  return (
    <>
      <article className="panel alerts-panel">
        <div className="panel-head">
          <div>
            <h3>{variant === "full" ? "All alerts" : "Priority alerts"}</h3>
            <p>Derived from 10-second operational polling</p>
          </div>
          {variant === "full" && <input className="search" placeholder="Search alerts" value={search} onChange={(e) => setSearch(e.target.value)} />}
        </div>
        {stats && (
          <div className="alert-stats-row">
            <span>
              Total<b>{stats.total}</b>
            </span>
            <span>
              Active<b>{stats.active}</b>
            </span>
            <span>
              Closed<b>{stats.closed}</b>
            </span>
          </div>
        )}
        {error && list.length === 0 ? (
          <ErrorState message={error} onRetry={retry} />
        ) : (
          <AnimatePresence initial={false} key={variant === "full" ? `alerts-${resultVersion}` : "widget"}>
            {list.map((alert) => (
              <motion.button
                className="alert-row"
                key={alert.id}
                onClick={() => select(alert)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <span className={`alert-dot ${alert.level}`} />
                <div>
                  <b>{alert.title}</b>
                  <small>{alert.location}</small>
                </div>
                <time>{alert.age}</time>
                <i>›</i>
              </motion.button>
            ))}
          </AnimatePresence>
        )}
        {variant === "widget" && (
          <Link href="/dashboard/alerts" className="view-all-link">
            View all alerts →
          </Link>
        )}
        {variant === "full" && (
          <div className="pagination-row">
            <button onClick={goPrev} disabled={pageIndex === 0}>
              ‹ Previous
            </button>
            <span>Page {pageIndex + 1}</span>
            <button onClick={goNext} disabled={!hasMore}>
              Next ›
            </button>
          </div>
        )}
      </article>
      <AlertModal selected={selected} onClose={() => select(null)} onCloseAlert={close} />
    </>
  );
}

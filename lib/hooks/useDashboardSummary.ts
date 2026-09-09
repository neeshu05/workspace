import { useCallback, useEffect, useRef, useState } from "react";
import { getSummary, Summary } from "../services/dashboardService";
import { UnauthorizedError, redirectToLogin } from "../services/http";
import { useSettingsStore } from "../stores/useSettingsStore";

export function useDashboardSummary() {
  const paused = useSettingsStore((s) => s.liveTrackingPaused);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const load = useCallback(async () => {
    try {
      const data = await getSummary();
      if (mounted.current) {
        setSummary(data);
        setError(null);
      }
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        redirectToLogin();
        return;
      }
      if (mounted.current) setError(e instanceof Error ? e.message : "Failed to load summary");
    }
  }, []);

  useEffect(() => {
    load();
    if (paused) return;
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [paused, load]);

  return { summary, error, reload: load };
}

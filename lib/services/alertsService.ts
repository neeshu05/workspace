import { getJson, patchJson } from "./http";

export type Alert = { id: string; level: string; title: string; location: string; age: string };
export type AlertStats = { total: number; active: number; closed: number };
export type AlertsPage = { alerts: Alert[]; nextCursor: string | null; hasMore: boolean; updatedAt: string };

export function getAlerts(opts: { limit?: number; cursor?: string; search?: string } = {}) {
  const qs = new URLSearchParams({
    limit: String(opts.limit ?? 12),
    ...(opts.cursor ? { cursor: opts.cursor } : {}),
    ...(opts.search ? { search: opts.search } : {}),
  });
  return getJson<AlertsPage>(`/api/dashboard/alerts?${qs}`);
}

export function getAlertStats() {
  return getJson<AlertStats>("/api/dashboard/alert-stats");
}

export function closeAlert(id: string) {
  return patchJson<{ ok: true }>(`/api/dashboard/alerts/${id}`, {});
}

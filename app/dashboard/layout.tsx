"use client";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useSilentRefresh } from "../../lib/hooks/useSilentRefresh";
import { useProfileStore } from "../../lib/stores/useProfileStore";
import { ensureAlertStatsPolling } from "../../lib/stores/useAlertStatsStore";
import SideNav from "../ui/layout/SideNav";
import TopNav from "../ui/layout/TopNav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const path = usePathname();

  useSilentRefresh();

  const loadProfile = useProfileStore((s) => s.load);
  useEffect(() => {
    loadProfile();
  }, [path, loadProfile]);

  useEffect(() => {
    ensureAlertStatsPolling();
  }, []);

  return (
    <div className="app-shell">
      <SideNav />
      <main className="workspace">
        <TopNav />
        {children}
      </main>
    </div>
  );
}

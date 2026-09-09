"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAlertStatsStore } from "../../../lib/stores/useAlertStatsStore";
import { logout as logoutRequest } from "../../../lib/services/authService";
import { NAVIGATION } from "../../../lib/utils/navigation";
import LogoutButton from "./LogoutButton";

export default function SideNav() {
  const path = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const activeAlerts = useAlertStatsStore((s) => s.stats?.active ?? null);

  async function logout() {
    setLoggingOut(true);
    await logoutRequest();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside>
      <Link className="sidebar-brand" href="/dashboard">
        <span>A</span> APEX
      </Link>
      <p className="nav-label">WORKSPACE</p>
      <nav>
        {NAVIGATION.map(([href, label, icon]) => (
          <Link className={path === href ? "active" : ""} href={href} key={href}>
            <i>{icon}</i>
            {label}
            {label === "Alerts" && !!activeAlerts && <em>{activeAlerts}</em>}
          </Link>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <LogoutButton loggingOut={loggingOut} onLogout={logout} />
      </div>
    </aside>
  );
}

"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAlertStatsStore } from "../../../lib/stores/useAlertStatsStore";
import { logout as logoutRequest } from "../../../lib/services/authService";

const navigation = [
  ["/dashboard", "Overview", "⌁"],
  ["/dashboard/analytics", "Analytics", "◔"],
  ["/dashboard/alerts", "Alerts", "!"],
  ["/dashboard/inventory", "Inventory", "□"],
  ["/dashboard/settings", "Settings", "⚙"],
  ["/dashboard/profile", "Profile", "◉"],
];

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
        {navigation.map(([href, label, icon]) => (
          <Link className={path === href ? "active" : ""} href={href} key={href}>
            <i>{icon}</i>
            {label}
            {label === "Alerts" && !!activeAlerts && <em>{activeAlerts}</em>}
          </Link>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button className="logout" onClick={logout} disabled={loggingOut}>
          <AnimatePresence mode="wait" initial={false}>
            {loggingOut ? (
              <motion.span className="logout-inner" key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <motion.span className="spinner" animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} />
                Signing out…
              </motion.span>
            ) : (
              <motion.span className="logout-inner" key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                ⇥ Sign out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </aside>
  );
}

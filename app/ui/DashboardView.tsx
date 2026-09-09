"use client";
import { useEffect } from "react";
import SettingsPage from "./settings/SettingsPage";
import ProfilePage from "./profile/ProfilePage";
import DashboardMainPage from "./dashboard/DashboardMainPage";
import { useSettingsStore } from "../../lib/stores/useSettingsStore";
import { useProfileStore } from "../../lib/stores/useProfileStore";
import { PAGE_TITLES } from "../../lib/utils/pageTitles";

export default function DashboardView({ page }: { page: string }) {
  const loadSettings = useSettingsStore((s) => s.load);
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const loadProfile = useProfileStore((s) => s.load);
  useEffect(() => {
    if (page === "profile" || page === "settings") loadProfile();
  }, [page, loadProfile]);

  const [title, subtitle] = PAGE_TITLES[page];

  if (page === "settings") return <SettingsPage title={title} subtitle={subtitle} />;
  if (page === "profile") return <ProfilePage title={title} subtitle={subtitle} />;
  return <DashboardMainPage page={page} title={title} subtitle={subtitle} />;
}

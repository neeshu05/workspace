"use client";
import Title from "../shared/Title";
import ErrorState from "../shared/ErrorState";
import ProfileSummaryCard from "./ProfileSummaryCard";
import ActivityFeed from "./ActivityFeed";
import { useProfileStore } from "../../../lib/stores/useProfileStore";

export default function ProfilePage({ title, subtitle }: { title: string; subtitle: string }) {
  const profile = useProfileStore((s) => s.profile);
  const profileError = useProfileStore((s) => s.error);
  const loadProfile = useProfileStore((s) => s.load);

  return (
    <section className="content">
      <Title title={title} subtitle={subtitle} />
      {!profile && profileError ? (
        <ErrorState message={profileError} onRetry={loadProfile} />
      ) : (
        <>
          <ProfileSummaryCard profile={profile} />
          <ActivityFeed activity={profile?.activity ?? []} />
        </>
      )}
    </section>
  );
}

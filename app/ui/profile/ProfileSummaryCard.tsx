import { Profile } from "../../../lib/services/profileService";

export default function ProfileSummaryCard({ profile }: { profile: Profile | null }) {
  return (
    <div className="profile-card panel">
      <div className="profile-avatar" style={profile?.avatarImage ? { backgroundImage: `url(${profile.avatarImage})` } : undefined}>
        {!profile?.avatarImage && (profile?.avatarInitials ?? "—")}
      </div>
      <div>
        <h2>{profile?.name ?? "Loading…"}</h2>
        <p>{[profile?.role, profile?.department].filter(Boolean).join(" · ")}</p>
        <span className="role-tag">ACTIVE SESSION</span>
      </div>
    </div>
  );
}

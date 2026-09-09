"use client";
import { useProfileStore } from "../../../lib/stores/useProfileStore";

export default function TopNav() {
  const profile = useProfileStore((s) => s.profile);

  return (
    <header>
      <div>
        <p className="eyebrow">TUESDAY, SEPTEMBER 9</p>
        <h2>Warehouse command center</h2>
      </div>
      <div className="header-right">
        <span className="live-pill">
          <b /> LIVE
        </span>
        <div
          className="avatar"
          style={profile?.avatarImage ? { backgroundImage: `url(${profile.avatarImage})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        >
          {!profile?.avatarImage && (profile?.avatarInitials ?? "—")}
        </div>
        <div>
          <strong>{profile?.name ?? "—"}</strong>
          <small>{profile?.role ?? ""}</small>
        </div>
      </div>
    </header>
  );
}

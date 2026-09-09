import { ProfileActivity } from "../../../lib/services/profileService";
import { formatClockTime } from "../../../lib/utils/format";

export default function ActivityFeed({ activity }: { activity: ProfileActivity[] }) {
  return (
    <article className="panel">
      <h3>Session activity</h3>
      {activity.map((a, i) => (
        <div className="activity" key={a.id}>
          <span>{formatClockTime(a.createdAt)}</span>
          <p>
            {a.action}
            {a.detail ? ` · ${a.detail}` : ""} {i === 0 && <b>Current</b>}
          </p>
        </div>
      ))}
    </article>
  );
}

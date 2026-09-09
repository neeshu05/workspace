import { formatClockTime } from "../../../lib/utils/format";

export default function Title({ title, subtitle, updated }: { title: string; subtitle: string; updated?: string }) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="last-updated">● Aggregates updated {updated ? formatClockTime(updated) : "..."}</div>
    </div>
  );
}

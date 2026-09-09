export default function StatLine({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="stat-line">
      <span>{label}</span>
      <b className={positive ? "positive" : ""}>{value}</b>
    </div>
  );
}

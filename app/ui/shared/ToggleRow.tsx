export default function ToggleRow({ label, on, onClick, disabled }: { label: string; on: boolean; onClick?: () => void; disabled?: boolean }) {
  return (
    <label className="toggle-row">
      {label}{" "}
      <button className={`toggle ${on ? "on" : ""}`} onClick={onClick} disabled={disabled}>
        <span />
      </button>
    </label>
  );
}

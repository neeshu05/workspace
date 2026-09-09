export default function PollingIntervalPanel() {
  return (
    <article className="panel">
      <h3>Polling interval</h3>
      <p>Aggregated summaries refresh every 10 seconds.</p>
      <div className="range">
        <span>5 sec</span>
        <input type="range" min="5" max="15" defaultValue="10" />
        <span>15 sec</span>
      </div>
    </article>
  );
}

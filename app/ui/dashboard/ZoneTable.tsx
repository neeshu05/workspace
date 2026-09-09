const ZONES = ["Receiving A", "Cold storage C", "High-bay D"];
const INVENTORY_DETAIL = ["1,284 units", "2,091 units", "238 units"];
const ANALYTICS_SCORE = ["98.9%", "97.8%", "99.2%"];
const INVENTORY_FULL = ["76% full", "64% full", "32% full"];

export default function ZoneTable({ page }: { page: string }) {
  const isAnalytics = page === "analytics";
  return (
    <article className="panel table-panel">
      <h3>{isAnalytics ? "Performance by zone" : "Active storage zones"}</h3>
      <table>
        <tbody>
          {ZONES.map((zone, i) => (
            <tr key={zone}>
              <td>
                <b>{zone}</b>
                <small>{isAnalytics ? "Live operational zone" : INVENTORY_DETAIL[i]}</small>
              </td>
              <td>{isAnalytics ? ANALYTICS_SCORE[i] : INVENTORY_FULL[i]}</td>
              <td>
                <span className="status good">On target</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}

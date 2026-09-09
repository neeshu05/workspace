import { buildZoneRows } from "../../../lib/utils/zoneTable";

export default function ZoneTable({ page }: { page: string }) {
  const isAnalytics = page === "analytics";
  const rows = buildZoneRows(page);

  return (
    <article className="panel table-panel">
      <h3>{isAnalytics ? "Performance by zone" : "Active storage zones"}</h3>
      <table>
        <tbody>
          {rows.map((row) => (
            <tr key={row.zone}>
              <td>
                <b>{row.zone}</b>
                <small>{row.detail}</small>
              </td>
              <td>{row.score}</td>
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

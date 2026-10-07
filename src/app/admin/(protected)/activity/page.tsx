import { guardAdminPage } from "@/lib/auth";
import { getActivity } from "@/services/admin";
import { dateTime } from "@/lib/format";
export const metadata = { title: "Activity log" };
export default async function ActivityLog({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // Admins only: the log shows what every member of staff has done.
  if (!(await guardAdminPage())) return null;
  const q = String((await searchParams).q || "")
    .trim()
    .toLowerCase()
    .slice(0, 100);
  const all = await getActivity();
  const rows = (all || []).filter((a) =>
    `${a.actor_name} ${a.action} ${a.entity} ${a.summary}`.toLowerCase().includes(q),
  );
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Team</span>
          <h1>Activity log</h1>
          <p>
            What admins and staff changed, newest first. Stock changes have their own history under
            Inventory.
          </p>
        </div>
      </div>
      {all === null ? (
        <div className="info-message">The activity log is not available yet.</div>
      ) : (
        <>
          <form className="catalog-tools" method="get">
            <div className="search-field">
              <input
                name="q"
                aria-label="Search the activity log"
                placeholder="Search by person, item or action…"
                defaultValue={q}
                maxLength={100}
              />
            </div>
            <button className="button button-outline">Search</button>
          </form>
          {rows.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Who</th>
                    <th>Action</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <tr key={a.id}>
                      <td>{dateTime(a.created_at)}</td>
                      <td>
                        <strong>{a.actor_name || "Unknown"}</strong>
                      </td>
                      <td>
                        {a.action} {a.entity}
                      </td>
                      <td>{a.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="info-message">
              {q ? "Nothing in the log matches your search." : "Nothing has been recorded yet."}
            </p>
          )}
          {all.length === 500 && (
            <p className="muted small-print">Showing the 500 most recent entries.</p>
          )}
        </>
      )}
    </>
  );
}

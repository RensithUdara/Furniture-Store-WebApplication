import { Download, FileSpreadsheet } from "lucide-react";
import { guardAdminPage } from "@/lib/auth";
import { getOrders } from "@/services/orders";
import { getProducts } from "@/services/catalog";
import { addDays, PERIODS, salesReport, today, type Period } from "@/lib/reports";
import { money } from "@/lib/format";
import { ColumnChart, RankBars } from "@/components/admin/charts";
export const metadata = { title: "Sales reports" };
const valid = (value: unknown, fallback: string) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
export default async function Reports({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await guardAdminPage("dashboard"))) return null;
  const q = await searchParams;
  const now = today();
  let to = valid(q.to, now),
    from = valid(q.from, addDays(to, -29));
  if (from > to) [from, to] = [to, from];
  const period = (PERIODS.includes(q.group as Period) ? q.group : "day") as Period;
  const [orders, products] = await Promise.all([getOrders(true), getProducts(true)]);
  const r = salesReport(orders, products, from, to, period);
  const range = `from=${from}&to=${to}&group=${period}`;
  const presets = [
    ["Last 7 days", addDays(now, -6), now, "day"],
    ["Last 30 days", addDays(now, -29), now, "day"],
    ["Last 12 weeks", addDays(now, -83), now, "week"],
    ["This year", `${now.slice(0, 4)}-01-01`, now, "month"],
  ];
  const stats = [
    ["Sales", money(r.totals.sales), `${r.totals.orders} orders, not counting cancelled`],
    ["Paid", money(r.totals.paid), "Verified PayHere and collected cash"],
    ["Refunded", money(r.totals.refunded), "Returned to customers"],
    [
      "Average order",
      money(r.totals.orders ? Math.round(r.totals.sales / r.totals.orders) : 0),
      `${r.totals.items} items sold · ${r.cancelled} cancelled`,
    ],
  ];
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Overview</span>
          <h1>Sales reports</h1>
          <p>
            Orders placed in the chosen dates, in Sri Lanka time. Cancelled orders are left out of
            every figure.
          </p>
        </div>
        <div className="admin-actions">
          <a
            className="button button-outline"
            href={`/api/reports?${range}&format=csv&sheet=orders`}
          >
            <Download size={16} /> Orders CSV
          </a>
          <a className="button" href={`/api/reports?${range}&format=xlsx`}>
            <FileSpreadsheet size={16} /> Excel
          </a>
        </div>
      </div>
      <form className="report-filter form-card" method="get">
        <label className="field">
          From
          <input type="date" name="from" defaultValue={from} max={now} required />
        </label>
        <label className="field">
          To
          <input type="date" name="to" defaultValue={to} max={now} required />
        </label>
        <label className="field">
          Group by
          <select name="group" defaultValue={period}>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </label>
        <button className="button">Show</button>
        <div className="report-presets">
          {presets.map(([name, f, t, g]) => (
            <a key={name} href={`?from=${f}&to=${t}&group=${g}`}>
              {name}
            </a>
          ))}
        </div>
      </form>
      <div className="stat-grid">
        {stats.map(([name, value, note], i) => (
          <div className={`stat-card tone-${i + 1}`} key={name}>
            <p>{name}</p>
            <strong>{value}</strong>
            <small>{note}</small>
          </div>
        ))}
      </div>
      <section className="panel">
        <div className="admin-section-title">
          <h2>Sales by {period}</h2>
          <a className="text-link" href={`/api/reports?${range}&format=csv&sheet=sales`}>
            Download CSV
          </a>
        </div>
        <ColumnChart data={r.rows.map((x) => ({ label: x.label, value: x.sales }))} label="Sales" />
        <div className="table-wrap report-table">
          <table>
            <thead>
              <tr>
                <th>{period === "day" ? "Day" : period === "week" ? "Week" : "Month"}</th>
                <th>Orders</th>
                <th>Items</th>
                <th>Sales</th>
                <th>Paid</th>
                <th>Refunded</th>
              </tr>
            </thead>
            <tbody>
              {[...r.rows].reverse().map((x) => (
                <tr key={x.key} className={x.orders ? "" : "is-muted"}>
                  <td>{x.label}</td>
                  <td>{x.orders}</td>
                  <td>{x.items}</td>
                  <td>{money(x.sales)}</td>
                  <td>{money(x.paid)}</td>
                  <td>{x.refunded ? money(x.refunded) : "–"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>Total</th>
                <th>{r.totals.orders}</th>
                <th>{r.totals.items}</th>
                <th>{money(r.totals.sales)}</th>
                <th>{money(r.totals.paid)}</th>
                <th>{r.totals.refunded ? money(r.totals.refunded) : "–"}</th>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="admin-section-title">
            <h2>Best sellers</h2>
            <a className="text-link" href={`/api/reports?${range}&format=csv&sheet=products`}>
              Download CSV
            </a>
          </div>
          {r.bestSellers.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Units</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {r.bestSellers.slice(0, 15).map((b, i) => (
                    <tr key={b.name + i}>
                      <td>
                        <strong>{b.name}</strong>
                      </td>
                      <td>{b.quantity}</td>
                      <td>{b.orders}</td>
                      <td>{money(b.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">Nothing sold in this period yet.</p>
          )}
        </section>
        <section className="panel">
          <div className="admin-section-title">
            <h2>Revenue by category</h2>
          </div>
          <RankBars
            data={r.categories.slice(0, 8).map((c) => ({ name: c.name, value: c.revenue }))}
          />
        </section>
      </div>
    </>
  );
}

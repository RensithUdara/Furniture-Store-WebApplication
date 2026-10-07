import Link from "next/link";
import { AlertTriangle, Armchair, Banknote, ClipboardList, Clock, Plus } from "lucide-react";
import { guardAdminPage, requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getProducts } from "@/services/catalog";
import { getOrders } from "@/services/orders";
import { getSettings } from "@/services/settings";
import { money, label, stockLabel, stockTone } from "@/lib/format";
import { OrderTable } from "@/components/order-table";
import { ColumnChart, RankBars } from "@/components/admin/charts";
import { addDays, salesReport, today as reportToday } from "@/lib/reports";
export const metadata = { title: "Store overview" };
const statuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
export default async function Dashboard() {
  if (!(await guardAdminPage("dashboard"))) return null;
  const user = await requirePermission("dashboard");
  const [products, orders, settings] = await Promise.all([
    getProducts(true),
    getOrders(true),
    getSettings(),
  ]);
  const firstName = String(user.profile?.name || "").split(" ")[0];
  const today = new Date().toLocaleDateString("en-GB", {
    timeZone: "Asia/Colombo",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const methods = [
    ["PAYHERE", "PayHere"],
    ["COD", "Cash"],
    ["WHATSAPP", "WhatsApp"],
  ];
  const low = products
    .filter((p) => p.is_active)
    .flatMap((p) => p.product_variants.filter((v) => v.is_active).map((v) => ({ p, v })))
    // Each finish has its own reorder level once migration 013 has been run; ten until then.
    .filter(({ v }) => v.stock_quantity <= (v.reorder_level ?? 10))
    .sort((a, b) => a.v.stock_quantity - b.v.stock_quantity);
  // The last 30 days, for the two charts.
  const month = salesReport(orders, products, addDays(reportToday(), -29), reportToday(), "day");
  const pending = orders.filter((o) => o.order_status === "PENDING").length;
  const live = orders.filter((o) => o.order_status !== "CANCELLED");
  const revenue = live
    .filter((o) => o.payment_status === "PAID" && !o.requires_review)
    .reduce((a, o) => a + Number(o.total_amount), 0);
  const whatsappValue = live
    .filter((o) => o.payment_method === "WHATSAPP")
    .reduce((a, o) => a + Number(o.total_amount), 0);
  const stats = [
    {
      name: "Paid revenue",
      value: money(revenue),
      note: "PayHere and collected cash",
      icon: Banknote,
    },
    {
      name: "Orders",
      value: orders.length,
      note: `${money(whatsappValue)} via WhatsApp`,
      icon: ClipboardList,
    },
    { name: "Awaiting action", value: pending, note: "Pending orders", icon: Clock },
    {
      name: "Products",
      value: products.length,
      note: `${products.filter((p) => p.is_active).length} visible in store`,
      icon: Armchair,
    },
    {
      name: "Low stock",
      value: low.length,
      note: "Finishes at their reorder level",
      icon: AlertTriangle,
    },
  ];
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow">{today}</span>
          <h1>Welcome back{firstName ? `, ${firstName}` : ""}</h1>
          <p>Sales, orders, and stock at a glance.</p>
        </div>
        <div className="admin-actions">
          {can(user.profile, "orders") && (
            <Link className="button button-outline" href="/admin/orders">
              <ClipboardList size={16} /> Review orders
            </Link>
          )}
          {can(user.profile, "products") && (
            <Link className="button" href="/admin/products/new">
              <Plus size={16} /> Add product
            </Link>
          )}
        </div>
      </div>
      {orders.some((o) => o.requires_review) && (
        <div className="error-message">
          Some orders require payment review. Check the orders list before fulfillment.
        </div>
      )}
      <div className="stat-grid">
        {stats.map(({ name, value, note, icon: Icon }, i) => (
          <div className={`stat-card tone-${i + 1}`} key={name}>
            <span className="stat-icon">
              <Icon size={18} />
            </span>
            <p>{name}</p>
            <strong>{value}</strong>
            <small>{note}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-grid charts-row">
        <section className="panel">
          <div className="admin-section-title">
            <h2>Sales trend, last 30 days</h2>
            <Link className="text-link" href="/admin/reports">
              Full report
            </Link>
          </div>
          <ColumnChart
            data={month.rows.map((r) => ({ label: r.label, value: r.sales }))}
            label="Sales"
          />
          <p className="muted small-print">
            {money(month.totals.sales)} from {month.totals.orders} orders, not counting cancelled.
          </p>
        </section>
        <section className="panel">
          <div className="admin-section-title">
            <h2>Top categories, last 30 days</h2>
          </div>
          <RankBars
            data={month.categories.slice(0, 6).map((c) => ({ name: c.name, value: c.revenue }))}
          />
        </section>
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="admin-section-title">
            <h2>Orders by status</h2>
          </div>
          <ul className="bar-list">
            {statuses.map((s) => {
              const n = orders.filter((o) => o.order_status === s).length;
              return (
                <li key={s}>
                  <span>{label(s)}</span>
                  <div>
                    <i
                      className={`status-${s.toLowerCase()}`}
                      style={{ width: `${orders.length ? (n / orders.length) * 100 : 0}%` }}
                    />
                  </div>
                  <b>{n}</b>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="panel">
          <div className="admin-section-title">
            <h2>How customers pay</h2>
          </div>
          <ul className="bar-list">
            {methods.map(([key, name]) => {
              const n = live.filter((o) => o.payment_method === key).length;
              return (
                <li key={key}>
                  <span>{name}</span>
                  <div>
                    <i
                      className={`method-${key.toLowerCase()}`}
                      style={{ width: `${live.length ? (n / live.length) * 100 : 0}%` }}
                    />
                  </div>
                  <b>{n}</b>
                </li>
              );
            })}
          </ul>
          <p className="muted small-print">Non-cancelled orders, by payment method.</p>
        </section>
        <section className="panel">
          <div className="admin-section-title">
            <h2>Low stock</h2>
            <Link className="text-link" href="/admin/inventory">
              Manage inventory
            </Link>
          </div>
          {low.length ? (
            <ul className="stock-list">
              {low.slice(0, 6).map(({ p, v }) => (
                <li key={v.id}>
                  <span>
                    <strong>{p.name}</strong>
                    <small>
                      {v.color} · {v.sku}
                    </small>
                  </span>
                  <span className={`status stock-${stockTone(v.stock_quantity)}`}>
                    {stockLabel(v.stock_quantity)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Every active finish is above its reorder level.</p>
          )}
        </section>
      </div>
      <div className="admin-section-title">
        <h2>Recent orders</h2>
        <Link className="text-link" href="/admin/orders">
          View all orders
        </Link>
      </div>
      <OrderTable orders={orders.slice(0, 5)} admin />
      <p className="muted small-print">
        Paid revenue counts signature-verified PayHere payments and cash-on-delivery orders marked
        delivered or collected, on non-cancelled orders without review flags. WhatsApp orders are
        settled offline and shown separately.
      </p>
    </>
  );
}

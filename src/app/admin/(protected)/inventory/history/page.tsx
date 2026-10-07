import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { guardAdminPage } from "@/lib/auth";
import { getStockMovements } from "@/services/admin";
import { dateTime } from "@/lib/format";
export const metadata = { title: "Stock history" };
const reasons: Record<string, string> = {
  INITIAL: "Product created",
  ORDER: "Order placed",
  RETURNED: "Order cancelled",
  ADJUSTMENT: "Changed by staff",
  IMPORT: "Spreadsheet import",
};
export default async function StockHistory({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  if (!(await guardAdminPage("inventory"))) return null;
  const { variant } = await searchParams;
  const id = z.uuid().safeParse(variant).success ? variant : undefined;
  const rows = await getStockMovements(id);
  const one = id && rows?.[0]?.product_variants;
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Stock control</span>
          <h1>Stock history</h1>
          <p>
            {one
              ? `Every change to ${one.products?.name || "this product"} (${one.color}, ${one.sku}), newest first.`
              : "Every change to stock, newest first: who made it, why, and the level it left."}
          </p>
        </div>
        <div className="admin-actions">
          {id && (
            <Link className="button button-outline" href="/admin/inventory/history">
              All items
            </Link>
          )}
          <Link className="button button-outline" href="/admin/inventory">
            <ArrowLeft size={16} /> Inventory
          </Link>
        </div>
      </div>
      {rows === null ? (
        <div className="info-message">Stock history is not available yet.</div>
      ) : rows.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Product / finish</th>
                <th>Change</th>
                <th>Stock after</th>
                <th>Reason</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id}>
                  <td>{dateTime(m.created_at)}</td>
                  <td>
                    <Link href={`/admin/inventory/history?variant=${m.variant_id}`}>
                      <strong>{m.product_variants?.products?.name || "Removed product"}</strong>
                    </Link>
                    <small>
                      {m.product_variants?.color} · {m.product_variants?.sku}
                    </small>
                  </td>
                  <td>
                    <strong className={m.change < 0 ? "stock-down" : "stock-up"}>
                      {m.change > 0 ? "+" : "−"}
                      {Math.abs(m.change)}
                    </strong>
                  </td>
                  <td>{m.quantity_after}</td>
                  <td>
                    {reasons[m.reason] || m.reason}
                    {m.note && <small>{m.note}</small>}
                  </td>
                  <td>{m.actor_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="info-message">
          No stock changes recorded yet. Changes are recorded from now on.
        </p>
      )}
      {rows && rows.length === 300 && (
        <p className="muted small-print">Showing the 300 most recent changes.</p>
      )}
    </>
  );
}

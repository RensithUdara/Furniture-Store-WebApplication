"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import { stockLabel, stockTone } from "@/lib/format";
import type { Product, Variant } from "@/types";
function StockEdit({ variant: v }: { variant: Variant }) {
  const router = useRouter();
  const [value, setValue] = useState(v.stock_quantity),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <>
      <form
        className="inline-stock"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMessage("");
          try {
            await api("/api/inventory", "PATCH", {
              id: v.id,
              stock_quantity: value,
              previous: v.stock_quantity,
            });
            router.refresh();
            setMessage("Saved");
          } catch (e) {
            setMessage(e instanceof Error ? e.message : "Unable to save.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <input
          aria-label={`Available stock for ${v.sku}`}
          type="number"
          min="0"
          max="100000"
          step="1"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          required
        />
        <button className="button button-small" disabled={busy || value === v.stock_quantity}>
          {busy ? "…" : "Save"}
        </button>
      </form>
      {message && (
        <small role="status" style={{ display: "block", maxWidth: 220, whiteSpace: "normal" }}>
          {message}
        </small>
      )}
    </>
  );
}
// The stock level at which a finish counts as low and staff are alerted.
function ReorderEdit({ variant: v }: { variant: Variant }) {
  const router = useRouter();
  const [value, setValue] = useState(v.reorder_level ?? 5),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function save() {
    if (value === v.reorder_level || !Number.isInteger(value) || value < 0) return;
    setBusy(true);
    setMessage("");
    try {
      await api("/api/inventory", "PATCH", { id: v.id, reorder_level: value });
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <input
        className="reorder-input"
        aria-label={`Reorder level for ${v.sku}`}
        type="number"
        min="0"
        max="100000"
        step="1"
        value={value}
        disabled={busy}
        onChange={(e) => setValue(Number(e.target.value))}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && save()}
      />
      {message && <small role="status">{message}</small>}
    </>
  );
}
export function InventoryTable({ products }: { products: Product[] }) {
  const [low, setLow] = useState(false),
    [query, setQuery] = useState("");
  // Reorder levels and stock history arrive with migration 013.
  const levels = products.some((p) =>
    p.product_variants.some((v) => v.reorder_level !== undefined),
  );
  const rows = products
    .flatMap((p) => p.product_variants.map((v) => ({ p, v })))
    .filter(
      ({ p, v }) =>
        (!low || v.stock_quantity <= (v.reorder_level ?? 10)) &&
        `${p.name} ${v.sku}`.toLowerCase().includes(query.toLowerCase()),
    );
  return (
    <>
      <div className="catalog-tools">
        <div className="search-field">
          <input
            aria-label="Search inventory"
            placeholder="Search product or SKU…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <label className="check-label">
          <input type="checkbox" checked={low} onChange={(e) => setLow(e.target.checked)} />
          Low stock only
        </label>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product / finish</th>
              <th>SKU</th>
              <th>Status</th>
              <th>Available to sell</th>
              {levels && <th>Reorder at</th>}
              {levels && <th>History</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, v }) => (
              <tr key={v.id}>
                <td>
                  <strong>{p.name}</strong>
                  <small>
                    {v.color} / {v.material}
                    {!v.is_active ? " · inactive" : ""}
                  </small>
                </td>
                <td>{v.sku}</td>
                <td>
                  <span className={`status stock-${stockTone(v.stock_quantity)}`}>
                    {stockLabel(v.stock_quantity)}
                  </span>
                  {levels && v.stock_quantity > 0 && v.stock_quantity <= (v.reorder_level ?? 0) && (
                    <small className="reorder-flag">Reorder now</small>
                  )}
                </td>
                <td>
                  <StockEdit key={`${v.id}:${v.stock_quantity}`} variant={v} />
                </td>
                {levels && (
                  <td>
                    <ReorderEdit key={`${v.id}:${v.reorder_level}`} variant={v} />
                  </td>
                )}
                {levels && (
                  <td>
                    <Link className="text-link" href={`/admin/inventory/history?variant=${v.id}`}>
                      View
                    </Link>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <p className="info-message">No inventory matches your filters.</p>}
    </>
  );
}

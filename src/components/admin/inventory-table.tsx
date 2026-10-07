"use client";
import { useState } from "react";
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
export function InventoryTable({ products }: { products: Product[] }) {
  const [low, setLow] = useState(false),
    [query, setQuery] = useState("");
  const rows = products
    .flatMap((p) => p.product_variants.map((v) => ({ p, v })))
    .filter(
      ({ p, v }) =>
        (!low || v.stock_quantity <= 10) &&
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
                </td>
                <td>
                  <StockEdit key={`${v.id}:${v.stock_quantity}`} variant={v} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <p className="info-message">No inventory matches your filters.</p>}
    </>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Trash2 } from "lucide-react";
import { api } from "@/lib/client-api";
import { useConfirm } from "@/components/dialogs";
import { AdminList } from "@/components/admin/admin-list";
import { money } from "@/lib/format";
import type { Bundle, Product } from "@/types";
function BundleForm({
  bundle: b,
  products,
  onDone,
}: {
  bundle?: Bundle;
  products: Product[];
  onDone: () => void;
}) {
  const confirm = useConfirm();
  const router = useRouter();
  const [chosen, setChosen] = useState<string[]>(b?.product_ids || []),
    [percent, setPercent] = useState(b ? String(b.discount_percent) : "10"),
    [query, setQuery] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const apart = chosen.reduce(
    (sum, id) => sum + Number(products.find((p) => p.id === id)?.price || 0),
    0,
  );
  const saving = Math.round(apart * (Number(percent) || 0)) / 100;
  const q = query.trim().toLowerCase();
  // Chosen products stay listed while searching, so they can always be unticked.
  const listed = products.filter(
    (p) => chosen.includes(p.id) || `${p.name} ${p.categories?.name}`.toLowerCase().includes(q),
  );
  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      router.refresh();
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save the set.");
    } finally {
      setBusy(false);
    }
  }
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (chosen.length < 2) return setError("Choose at least two products.");
    run(() =>
      api("/api/bundles", "POST", {
        id: b?.id,
        name: form.get("name"),
        description: form.get("description"),
        image_url: b?.image_url || "",
        discount_percent: Number(percent),
        is_active: form.has("is_active"),
        product_ids: chosen,
      }),
    );
  }
  return (
    <form onSubmit={submit} className="form-card">
      <div className="form-grid">
        <label className="field">
          Set name
          <input
            name="name"
            defaultValue={b?.name}
            placeholder="The reading corner"
            minLength={2}
            maxLength={100}
            required
          />
        </label>
        <label className="field">
          Discount when ordered together (%)
          <input
            type="number"
            min="1"
            max="90"
            step="0.5"
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            required
          />
        </label>
        <label className="field full">
          Short description (optional)
          <input name="description" defaultValue={b?.description} maxLength={500} />
        </label>
        <label className="check-label">
          <input name="is_active" type="checkbox" defaultChecked={b?.is_active ?? true} />
          Offered in the store
        </label>
      </div>
      <h3>Products in the set ({chosen.length} of 8)</h3>
      <div className="search-field">
        <Search size={17} />
        <input
          aria-label="Search products"
          placeholder="Search products…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="pick-list">
        {listed.map((p) => {
          const on = chosen.includes(p.id);
          return (
            <label key={p.id} className={on ? "is-on" : ""}>
              <input
                type="checkbox"
                checked={on}
                disabled={!on && chosen.length >= 8}
                onChange={() =>
                  setChosen(on ? chosen.filter((id) => id !== p.id) : [...chosen, p.id])
                }
              />
              <img src={p.product_images[0]?.image_url || "/images/living.jpg"} alt="" />
              <span>
                {p.name}
                <small>
                  {p.categories?.name}
                  {!p.is_active && " · hidden"}
                </small>
              </span>
              <b>{money(p.price)}</b>
            </label>
          );
        })}
        {!listed.length && <p className="muted">No products match.</p>}
      </div>
      {chosen.length >= 2 && (
        <p className="info-message">
          From {money(apart)} apart, {money(apart - saving)} together: a saving of {money(saving)}.
          The saving is worked out from the finishes the customer actually orders.
        </p>
      )}
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      <div className="order-actions">
        <button className="button" disabled={busy}>
          {busy ? "Saving…" : b ? "Save set" : "Create set"}
        </button>
        {b && (
          <button
            type="button"
            className="button button-outline"
            disabled={busy}
            onClick={async () => {
              if (
                await confirm({
                  title: `Delete ${b.name}?`,
                  message:
                    "The products stay in the store. Orders that already had this saving keep it.",
                  confirmLabel: "Delete set",
                  tone: "danger",
                })
              )
                run(() => api("/api/bundles", "DELETE", { id: b.id }));
            }}
          >
            <Trash2 size={15} /> Delete
          </button>
        )}
      </div>
    </form>
  );
}
export function BundleManager({ bundles, products }: { bundles: Bundle[]; products: Product[] }) {
  const names = (b: Bundle) =>
    b.product_ids.map((id) => products.find((p) => p.id === id)?.name || "Removed product");
  return (
    <AdminList
      items={bundles}
      noun="room set"
      plural="room sets"
      size="lg"
      rowKey={(b) => b.id}
      rowLabel={(b) => b.name}
      searchText={(b) => `${b.name} ${names(b).join(" ")}`}
      columns={[
        {
          header: "Set",
          cell: (b) => (
            <>
              <strong>{b.name}</strong>
              <small>{names(b).join(" + ")}</small>
            </>
          ),
        },
        { header: "Products", cell: (b) => b.product_ids.length },
        { header: "Saving", cell: (b) => `${b.discount_percent}% off` },
        {
          header: "Status",
          cell: (b) => {
            // A set cannot be completed while one of its products is hidden.
            const whole = b.product_ids.every((id) => products.find((p) => p.id === id)?.is_active);
            return (
              <span className={`status ${b.is_active && whole ? "status-paid" : ""}`}>
                {!b.is_active ? "Off" : whole ? "Offered" : "A product is hidden"}
              </span>
            );
          },
        },
      ]}
    >
      {(b, close) => <BundleForm bundle={b} products={products} onDone={close} />}
    </AdminList>
  );
}

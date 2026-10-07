"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Trash2 } from "lucide-react";
import { api } from "@/lib/client-api";
import { useConfirm } from "@/components/dialogs";
import { AdminList } from "@/components/admin/admin-list";
import { dateTime, money } from "@/lib/format";
import { flashPrice } from "@/lib/flash";
import type { FlashSale, Product } from "@/types";
// datetime-local works in the browser's own time zone; convert to and from stored UTC.
const toLocal = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const state = (s: FlashSale) => {
  const now = Date.now();
  return !s.is_active
    ? "Off"
    : Date.parse(s.ends_at) < now
      ? "Ended"
      : Date.parse(s.starts_at) > now
        ? "Scheduled"
        : "Running";
};
function FlashForm({
  sale: s,
  products,
  onDone,
}: {
  sale?: FlashSale;
  products: Product[];
  onDone: () => void;
}) {
  const confirm = useConfirm();
  const router = useRouter();
  const [all, setAll] = useState(s?.all_products ?? false),
    [chosen, setChosen] = useState<string[]>(s?.product_ids || []),
    [percent, setPercent] = useState(s ? String(s.discount_percent) : "15"),
    [query, setQuery] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const q = query.trim().toLowerCase();
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
      setError(e instanceof Error ? e.message : "Unable to save the sale.");
    } finally {
      setBusy(false);
    }
  }
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const starts = new Date(String(form.get("starts_at"))),
      ends = new Date(String(form.get("ends_at")));
    if (!(ends > starts)) return setError("The sale must end after it starts.");
    if (!all && !chosen.length)
      return setError("Choose the products on sale, or put the whole store on sale.");
    run(() =>
      api("/api/flash-sales", "POST", {
        id: s?.id,
        name: form.get("name"),
        discount_percent: Number(percent),
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        all_products: all,
        is_active: form.has("is_active"),
        product_ids: all ? [] : chosen,
      }),
    );
  }
  return (
    <form onSubmit={submit} className="form-card">
      <div className="form-grid">
        <label className="field">
          Sale name
          <input
            name="name"
            defaultValue={s?.name}
            placeholder="Weekend flash sale"
            minLength={2}
            maxLength={80}
            required
          />
          <small>Shown to shoppers beside the countdown.</small>
        </label>
        <label className="field">
          Discount (%)
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
        <label className="field">
          Starts
          <input
            name="starts_at"
            type="datetime-local"
            defaultValue={toLocal(s?.starts_at || new Date().toISOString())}
            required
          />
        </label>
        <label className="field">
          Ends
          <input name="ends_at" type="datetime-local" defaultValue={toLocal(s?.ends_at)} required />
        </label>
        <label className="check-label">
          <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} />
          Every product in the store
        </label>
        <label className="check-label">
          <input name="is_active" type="checkbox" defaultChecked={s?.is_active ?? true} />
          Switched on
        </label>
      </div>
      {!all && (
        <>
          <h3>Products on sale ({chosen.length})</h3>
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
                    disabled={!on && chosen.length >= 200}
                    onChange={() =>
                      setChosen(on ? chosen.filter((id) => id !== p.id) : [...chosen, p.id])
                    }
                  />
                  <img src={p.product_images[0]?.image_url || "/images/living.jpg"} alt="" />
                  <span>
                    {p.name}
                    <small>{p.categories?.name}</small>
                  </span>
                  <b>
                    {on && Number(percent) > 0 ? (
                      <>
                        <s>{money(p.price)}</s> {money(flashPrice(p.price, Number(percent)))}
                      </>
                    ) : (
                      money(p.price)
                    )}
                  </b>
                </label>
              );
            })}
            {!listed.length && <p className="muted">No products match.</p>}
          </div>
        </>
      )}
      <p className="info-message">
        During the sale, shoppers see the reduced price with the usual price struck through and a
        countdown, and orders are charged the reduced price. Where two sales cover the same product,
        the bigger discount applies. Coupons and room-set savings still apply on top.
      </p>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      <div className="order-actions">
        <button className="button" disabled={busy}>
          {busy ? "Saving…" : s ? "Save sale" : "Create sale"}
        </button>
        {s && (
          <button
            type="button"
            className="button button-outline"
            disabled={busy}
            onClick={async () => {
              if (
                await confirm({
                  title: `Delete ${s.name}?`,
                  message:
                    "Prices go back to normal straight away. Orders already placed keep the price they were charged.",
                  confirmLabel: "Delete sale",
                  tone: "danger",
                })
              )
                run(() => api("/api/flash-sales", "DELETE", { id: s.id }));
            }}
          >
            <Trash2 size={15} /> Delete
          </button>
        )}
      </div>
    </form>
  );
}
export function FlashManager({ sales, products }: { sales: FlashSale[]; products: Product[] }) {
  return (
    <AdminList
      items={sales}
      noun="flash sale"
      plural="flash sales"
      size="lg"
      rowKey={(s) => s.id}
      rowLabel={(s) => s.name}
      searchText={(s) => s.name}
      columns={[
        { header: "Sale", cell: (s) => <strong>{s.name}</strong> },
        { header: "Discount", cell: (s) => `${s.discount_percent}% off` },
        {
          header: "Applies to",
          cell: (s) =>
            s.all_products
              ? "Every product"
              : `${s.product_ids.length} ${s.product_ids.length === 1 ? "product" : "products"}`,
        },
        { header: "Starts", cell: (s) => dateTime(s.starts_at) },
        { header: "Ends", cell: (s) => dateTime(s.ends_at) },
        {
          header: "Status",
          cell: (s) => (
            <span className={`status ${state(s) === "Running" ? "status-paid" : ""}`}>
              {state(s)}
            </span>
          ),
        },
      ]}
    >
      {(s, close) => <FlashForm sale={s} products={products} onDone={close} />}
    </AdminList>
  );
}

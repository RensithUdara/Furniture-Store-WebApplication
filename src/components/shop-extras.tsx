"use client";
import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { BellRing, Scale, Star, Trash2, X } from "lucide-react";
import { api } from "@/lib/client-api";
import { useConfirm } from "@/components/dialogs";
import { ProductCard } from "@/components/product-card";
import { dateOnly, money } from "@/lib/format";
import { totalStock } from "@/lib/catalog-filter";
import type { Product, Review } from "@/types";

/* ---------- Star ratings ---------- */
export function Stars({ value, count, size = 15 }: { value: number; count?: number; size?: number }) {
  return (
    <span className="stars" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={value >= n - 0.25 ? "on" : value >= n - 0.75 ? "half" : ""} />
      ))}
      {count !== undefined && <small>({count})</small>}
    </span>
  );
}

/* ---------- Compare: a short list kept in this browser ---------- */
const MAX_COMPARE = 4;
type Compare = { ids: string[]; toggle: (id: string) => void; clear: () => void };
const CompareContext = createContext<Compare>({ ids: [], toggle: () => {}, clear: () => {} });
const read = (key: string): string[] => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter((v) => typeof v === "string").slice(0, 12) : [];
  } catch {
    return [];
  }
};
const write = (key: string, value: string[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};
export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => setIds(read("forma-compare").slice(0, MAX_COMPARE)), []);
  const save = (next: string[]) => {
    setIds(next);
    write("forma-compare", next);
  };
  return (
    <CompareContext.Provider
      value={{
        ids,
        toggle: (id) =>
          save(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id].slice(-MAX_COMPARE)),
        clear: () => save([]),
      }}
    >
      {children}
      {ids.length > 0 && (
        <div className="compare-bar" role="region" aria-label="Product comparison">
          <span>
            <Scale size={18} /> {ids.length} of {MAX_COMPARE} selected to compare
          </span>
          <Link className="button button-small" href="/compare">
            Compare now
          </Link>
          <button aria-label="Clear comparison" onClick={() => save([])}>
            <X size={18} />
          </button>
        </div>
      )}
    </CompareContext.Provider>
  );
}
export const useCompare = () => useContext(CompareContext);
export function CompareToggle({ productId, name }: { productId: string; name: string }) {
  const { ids, toggle } = useCompare();
  const on = ids.includes(productId);
  return (
    <button
      type="button"
      className={`compare-toggle${on ? " on" : ""}`}
      aria-pressed={on}
      aria-label={`${on ? "Remove" : "Add"} ${name} ${on ? "from" : "to"} comparison`}
      onClick={() => toggle(productId)}
    >
      <Scale size={14} /> {on ? "Comparing" : "Compare"}
    </button>
  );
}
// The comparison table on /compare. Rows are the facts shoppers weigh up for furniture.
export function CompareTable({ products }: { products: Product[] }) {
  const { ids, toggle, clear } = useCompare();
  const chosen = ids.flatMap((id) => products.find((p) => p.id === id) || []);
  if (!chosen.length)
    return (
      <div className="empty-state panel">
        <Scale size={38} />
        <h2>Nothing to compare yet</h2>
        <p>Use the Compare button on up to {MAX_COMPARE} products to see them side by side.</p>
        <Link className="button" href="/products">
          Browse furniture
        </Link>
      </div>
    );
  const rows: [string, (p: Product) => ReactNode][] = [
    [
      "Price",
      (p) => {
        const prices = p.product_variants.filter((v) => v.is_active).map((v) => Number(v.price));
        return prices.length > 1 && Math.min(...prices) !== Math.max(...prices)
          ? `${money(Math.min(...prices))} – ${money(Math.max(...prices))}`
          : money(p.price);
      },
    ],
    ["Rating", (p) => (p.rating ? <Stars value={p.rating.avg} count={p.rating.count} /> : "No reviews yet")],
    ["Category", (p) => p.categories?.name],
    ["Material", (p) => p.material],
    ["Dimensions", (p) => p.dimensions],
    ["Finishes", (p) => p.product_variants.filter((v) => v.is_active).map((v) => v.color).join(", ")],
    ["Availability", (p) => (totalStock(p) > 0 ? `${totalStock(p)} in stock` : "Out of stock")],
    ["Brand", (p) => p.brand],
  ];
  return (
    <>
      <div className="table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th>
                <button className="text-link" onClick={clear}>
                  Clear all
                </button>
              </th>
              {chosen.map((p) => (
                <th key={p.id}>
                  <Link href={`/products/${p.slug}`}>
                    <img src={p.product_images[0]?.image_url || "/images/living.jpg"} alt="" />
                    <strong>{p.name}</strong>
                  </Link>
                  <button className="compare-remove" onClick={() => toggle(p.id)}>
                    <X size={14} /> Remove
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, cell]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                {chosen.map((p) => (
                  <td key={p.id}>{cell(p)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row" />
              {chosen.map((p) => (
                <td key={p.id}>
                  <Link className="button button-small" href={`/products/${p.slug}`}>
                    View product
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ---------- Recently viewed: remembered in this browser ---------- */
export function RecentlyViewed({ current, products }: { current?: string; products: Product[] }) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    const seen = read("forma-recent");
    setIds(seen.filter((id) => id !== current));
    if (current) write("forma-recent", [current, ...seen.filter((id) => id !== current)].slice(0, 9));
  }, [current]);
  const list = ids.flatMap((id) => products.find((p) => p.id === id) || []).slice(0, 4);
  if (!list.length) return null;
  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Pick up where you left off</span>
          <h2>Recently viewed</h2>
        </div>
      </div>
      <div className="product-grid">
        {list.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

/* ---------- Back in stock ---------- */
export function NotifyMe({ variantId, signedIn }: { variantId: string; signedIn: boolean }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("busy");
    setError("");
    try {
      const email = String(new FormData(e.currentTarget).get("email") || "");
      await api("/api/stock-alerts", "POST", { variant_id: variantId, ...(email ? { email } : {}) });
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save your request.");
      setState("idle");
    }
  }
  if (state === "done")
    return (
      <p className="success-message" role="status">
        Request saved. {signedIn ? "It will show in your account" : "The store will contact you"}{" "}
        when this finish is back in stock.
      </p>
    );
  return (
    <form className="notify-me" onSubmit={submit}>
      <strong>
        <BellRing size={17} /> Want this when it is back?
      </strong>
      <div>
        {!signedIn && (
          <input name="email" type="email" required maxLength={254} placeholder="Your email address" />
        )}
        <button className="button button-small" disabled={state === "busy"}>
          {state === "busy" ? "Saving…" : "Tell me when it is back"}
        </button>
      </div>
      {error && <small className="field-error">{error}</small>}
    </form>
  );
}

/* ---------- Reviews ---------- */
export function Reviews({
  productId,
  reviews,
  eligible,
  userId,
  canModerate,
}: {
  productId: string;
  reviews: Review[];
  // Whether the signed-in customer has had this product delivered.
  eligible: boolean;
  userId: string | null;
  canModerate: boolean;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const mine = reviews.find((r) => r.user_id === userId);
  const [rating, setRating] = useState(mine?.rating || 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const average = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!rating) return setError("Choose a star rating.");
    setBusy(true);
    setError("");
    try {
      const form = new FormData(e.currentTarget);
      await api("/api/reviews", "POST", {
        product_id: productId,
        rating,
        title: form.get("title"),
        body: form.get("body"),
      });
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save your review.");
    } finally {
      setBusy(false);
    }
  }
  async function remove(r: Review) {
    if (
      !(await confirm({
        title: "Delete this review?",
        message: "It will be removed from the product page.",
        confirmLabel: "Delete review",
        tone: "danger",
      }))
    )
      return;
    try {
      await api("/api/reviews", "DELETE", { id: r.id });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete the review.");
    }
  }
  return (
    <section className="section reviews" id="reviews">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Verified buyers only</span>
          <h2>Customer reviews</h2>
        </div>
        {reviews.length > 0 && (
          <div className="review-summary">
            <strong>{average.toFixed(1)}</strong>
            <Stars value={average} size={18} />
            <small>
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </small>
          </div>
        )}
      </div>
      <div className="review-layout">
        <div className="review-list">
          {reviews.length ? (
            reviews.map((r) => (
              <article key={r.id} className="review">
                <header>
                  <Stars value={r.rating} />
                  <strong>{r.title || "Review"}</strong>
                  {(canModerate || r.user_id === userId) && (
                    <button aria-label="Delete review" onClick={() => remove(r)}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </header>
                {r.body && <p>{r.body}</p>}
                <small>
                  {r.author || "Customer"} · Verified buyer · {dateOnly(r.created_at)}
                </small>
              </article>
            ))
          ) : (
            <p className="muted">No reviews yet. Customers can review after their order is delivered.</p>
          )}
        </div>
        {eligible ? (
          <form className="form-card review-form" onSubmit={submit}>
            <h2>{mine ? "Update your review" : "Write a review"}</h2>
            <div className="stack">
              <div className="star-input" role="radiogroup" aria-label="Your rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
                    className={rating >= n ? "on" : ""}
                    onClick={() => setRating(n)}
                  >
                    <Star size={26} />
                  </button>
                ))}
              </div>
              <label className="field">
                Headline
                <input name="title" defaultValue={mine?.title} maxLength={120} />
              </label>
              <label className="field">
                Your review
                <textarea name="body" defaultValue={mine?.body} maxLength={2000} />
              </label>
              {error && (
                <p className="error-message" role="alert">
                  {error}
                </p>
              )}
              {saved && <p className="success-message">Thank you. Your review is published.</p>}
              <button className="button" disabled={busy}>
                {busy ? "Saving…" : mine ? "Update review" : "Publish review"}
              </button>
            </div>
          </form>
        ) : (
          <p className="info-message review-note">
            {userId
              ? "You can review this product once an order containing it has been delivered."
              : "Bought this? Sign in to review it once your order has been delivered."}
          </p>
        )}
      </div>
    </section>
  );
}

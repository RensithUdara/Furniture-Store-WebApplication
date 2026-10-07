"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Download, Truck, PackageSearch, RotateCcw, Search, Store } from "lucide-react";
import { Badge, Method } from "@/components/order-table";
import { useCart } from "@/components/cart-provider";
import { navigate } from "@/components/navigation-progress";
import { api } from "@/lib/client-api";
import { money, dateOnly } from "@/lib/format";
import type { Order, Product } from "@/types";
const steps = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
const tabs = [
  { key: "all", name: "All" },
  { key: "active", name: "In progress" },
  { key: "DELIVERED", name: "Completed" },
  { key: "CANCELLED", name: "Cancelled" },
];
const matches = (o: Order, tab: string) =>
  tab === "all" ||
  (tab === "active"
    ? !["DELIVERED", "CANCELLED"].includes(o.order_status)
    : o.order_status === tab);
// Puts the pieces from an earlier order back in the cart at today's price and stock.
function BuyAgain({ order }: { order: Order }) {
  const { add } = useCart();
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function run() {
    setBusy(true);
    setMessage("");
    try {
      const products = await api<Product[]>("/api/products");
      let added = 0;
      for (const item of order.order_items) {
        const product = products.find((p) =>
          p.product_variants.some((v) => v.id === item.variant_id),
        );
        const variant = product?.product_variants.find((v) => v.id === item.variant_id);
        if (!product || !variant || variant.stock_quantity < 1) continue;
        add({
          variant_id: variant.id,
          product_id: product.id,
          slug: product.slug,
          name: product.name,
          details: `${variant.color} / ${variant.material}`,
          image: product.product_images[0]?.image_url || "/images/living.jpg",
          price: Number(variant.price),
          quantity: Math.min(item.quantity, variant.stock_quantity, 20),
          stock: variant.stock_quantity,
        });
        added++;
      }
      if (!added) setMessage("These pieces are no longer available.");
      else navigate(router.push, "/cart");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to add these pieces.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button className="button button-outline button-small" disabled={busy} onClick={run}>
        <RotateCcw size={14} /> {busy ? "Adding…" : "Buy again"}
      </button>
      {message && <small className="order-card-note">{message}</small>}
    </>
  );
}
export function OrderCard({ order: o }: { order: Order }) {
  const cancelled = o.order_status === "CANCELLED";
  const step = steps.indexOf(o.order_status);
  const names = o.order_items.map((i) => `${i.product_name} × ${i.quantity}`);
  return (
    <article className="order-card">
      <header>
        <div>
          <strong>{o.order_number}</strong>
          <small>Placed {dateOnly(o.created_at)}</small>
        </div>
        <div className="order-badges">
          <Method value={o.payment_method} />
          <Badge value={o.payment_status} />
          <Badge value={o.order_status} />
        </div>
      </header>
      <p className="order-card-items">
        {names.slice(0, 2).join(", ")}
        {names.length > 2 && ` and ${names.length - 2} more`}
        {o.fulfillment_method === "PICKUP" && (
          <span className="pickup-flag">
            <Store size={13} /> Store pickup
          </span>
        )}
      </p>
      {o.tracking_number && !cancelled && (
        <p className="order-card-tracking">
          <Truck size={14} /> {o.courier ? `${o.courier} · ` : ""}Tracking{" "}
          <strong>{o.tracking_number}</strong>
        </p>
      )}
      {!cancelled && (
        <div
          className="order-progress"
          role="progressbar"
          aria-label="Order progress"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={step + 1}
        >
          {steps.map((s, i) => (
            <span key={s} className={i <= step ? "done" : ""} />
          ))}
        </div>
      )}
      <footer>
        <span className="order-card-total">{money(o.total_amount)}</span>
        <div className="order-card-actions">
          <BuyAgain order={o} />
          <a
            className="button button-outline button-small"
            href={`/api/orders/${o.id}/invoice`}
            download
            aria-label={`Download bill for ${o.order_number}`}
          >
            <Download size={14} /> Bill
          </a>
          <Link className="button button-small" href={`/orders/${o.id}`}>
            View order <ArrowRight size={14} />
          </Link>
        </div>
      </footer>
    </article>
  );
}
export function OrderHistory({ orders }: { orders: Order[] }) {
  const [tab, setTab] = useState("all"),
    [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const rows = orders.filter(
    (o) =>
      matches(o, tab) &&
      `${o.order_number} ${o.order_items.map((i) => i.product_name).join(" ")}`
        .toLowerCase()
        .includes(q),
  );
  if (!orders.length)
    return (
      <div className="empty-state panel">
        <PackageSearch size={38} />
        <h2>No orders yet</h2>
        <p>When you place an order it will appear here with live progress.</p>
        <Link className="button" href="/products">
          Start shopping <ArrowRight size={16} />
        </Link>
      </div>
    );
  return (
    <>
      <div className="tabs" role="tablist" aria-label="Filter orders">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={tab === t.key ? "active" : ""}
            onClick={() => setTab(t.key)}
          >
            {t.name}
            <span>{orders.filter((o) => matches(o, t.key)).length}</span>
          </button>
        ))}
      </div>
      <div className="catalog-tools">
        <div className="search-field">
          <Search size={18} />
          <input
            aria-label="Search your orders"
            placeholder="Search by order number or product…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      {rows.length ? (
        <div className="order-list">
          {rows.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      ) : (
        <p className="info-message">No orders match this filter.</p>
      )}
    </>
  );
}

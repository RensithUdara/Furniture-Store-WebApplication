"use client";
import { useState } from "react";
import { Search, Store, Truck } from "lucide-react";
import { api } from "@/lib/client-api";
import { Badge, Method } from "@/components/order-table";
import { OrderProgress, TrackingHistory } from "@/components/order-tracking";
import { dateOnly, dateTime, money } from "@/lib/format";
import type { OrderEvent, PaymentMethod } from "@/types";
type Tracked = {
  order_number: string;
  created_at: string;
  order_status: string;
  payment_status: string;
  payment_method: PaymentMethod;
  fulfillment_method: "DELIVERY" | "PICKUP";
  pickup_at: string | null;
  tracking_number: string;
  courier: string;
  city: string;
  total_amount: number;
  items: { product_name: string; variant_details: string; quantity: number }[];
  events: OrderEvent[];
};
export function TrackForm({ pickupAddress = "" }: { pickupAddress?: string }) {
  const [result, setResult] = useState<Tracked | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      setResult(
        await api<Tracked>("/api/track", "POST", Object.fromEntries(new FormData(e.currentTarget))),
      );
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Unable to look up that order.");
    } finally {
      setBusy(false);
    }
  }
  const o = result;
  const pickup = o?.fulfillment_method === "PICKUP";
  return (
    <>
      <form className="form-card track-form" onSubmit={submit}>
        <label className="field">
          Order number
          <input
            name="order_number"
            placeholder="FRM-XXXXXXXXXXXX"
            pattern="[Ff][Rr][Mm]-[A-Fa-f0-9]{12}"
            maxLength={16}
            autoCapitalize="characters"
            required
          />
          <small>It is on your order page, your bill, and your WhatsApp message.</small>
        </label>
        <label className="field">
          Phone number or email used on the order
          <input
            name="contact"
            placeholder="0771234567 or you@example.com"
            maxLength={254}
            required
          />
        </label>
        <button className="button" disabled={busy}>
          <Search size={17} /> {busy ? "Looking…" : "Track order"}
        </button>
      </form>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {o && (
        <section className="track-result" aria-live="polite">
          <div className="order-topline">
            <div>
              <span className="eyebrow">Placed {dateOnly(o.created_at)}</span>
              <h2>{o.order_number}</h2>
            </div>
            <div className="order-badges">
              <Method value={o.payment_method} />
              <Badge value={o.payment_status} />
              <Badge value={o.order_status} />
            </div>
          </div>
          {o.order_status === "CANCELLED" ? (
            <div className="error-message">This order was cancelled.</div>
          ) : (
            <OrderProgress status={o.order_status} pickup={pickup} />
          )}
          <div className="tracking-card">
            <span className="tracking-icon">
              {pickup ? <Store size={22} /> : <Truck size={22} />}
            </span>
            <div>
              <strong>{pickup ? "Store pickup" : `Delivery to ${o.city}`}</strong>
              {pickup ? (
                <p>
                  {o.pickup_at
                    ? `Collecting on ${dateTime(o.pickup_at)}`
                    : "Pickup time to be confirmed"}
                  {pickupAddress && ` · ${pickupAddress}`}
                </p>
              ) : o.courier || o.tracking_number ? (
                <dl>
                  {o.courier && (
                    <div>
                      <dt>Courier</dt>
                      <dd>{o.courier}</dd>
                    </div>
                  )}
                  {o.tracking_number && (
                    <div>
                      <dt>Tracking number</dt>
                      <dd className="tracking-number">{o.tracking_number}</dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p>
                  {["SHIPPED", "DELIVERED"].includes(o.order_status)
                    ? "Our delivery team will contact you by phone."
                    : "Courier details appear here once your order ships."}
                </p>
              )}
            </div>
          </div>
          <div className="track-columns">
            <TrackingHistory events={o.events} pickup={pickup} />
            <section className="panel">
              <h2 className="track-items-title">In this order</h2>
              <ul className="stock-list">
                {o.items.map((item, i) => (
                  <li key={i}>
                    <span>
                      <strong>{item.product_name}</strong>
                      <small>{item.variant_details}</small>
                    </span>
                    <span>× {item.quantity}</span>
                  </li>
                ))}
              </ul>
              <div className="summary-line total">
                <span>Total</span>
                <span>{money(o.total_amount)}</span>
              </div>
            </section>
          </div>
        </section>
      )}
    </>
  );
}

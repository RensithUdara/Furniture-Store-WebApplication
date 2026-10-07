"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  ArrowRight,
  Banknote,
  CreditCard,
  LockKeyhole,
  MessageCircle,
  Store,
  TicketPercent,
  Truck,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { money, deliveryFee, deliveryLabel } from "@/lib/format";
import type { PaymentMethod, StoreSettings } from "@/types";
import { checkoutSchema } from "@/lib/validation";
import { api, startPayment } from "@/lib/client-api";
// Dates are chosen in Sri Lanka time (UTC+05:30), whatever the shopper's device is set to.
const colomboDate = (daysAhead: number) =>
  new Date(Date.now() + daysAhead * 86400000 + 5.5 * 3600000).toISOString().slice(0, 10);
const hourLabel = (h: number) => `${((h + 11) % 12) + 1}:00 ${h % 24 < 12 ? "am" : "pm"}`;
export function CheckoutForm({
  sandbox = true,
  settings,
  name = "",
  email = "",
  phone = "",
  address,
  points = 0,
}: {
  sandbox?: boolean;
  settings: StoreSettings | null;
  name?: string;
  email?: string;
  phone?: string;
  // The saved address from the account, if there is one.
  address?: { line1: string; line2: string; city: string; postal: string };
  // The customer's reward point balance.
  points?: number;
}) {
  // Delivery or pickup is first chosen on the cart page and can still be changed here.
  const { items, ready, clear, fulfil, setFulfil } = useCart();
  const [method, setMethod] = useState<PaymentMethod>("PAYHERE");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [savedId, setSavedId] = useState("");
  const request = useRef<{ fingerprint: string; key: string } | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [redeem, setRedeem] = useState("");
  // Cash on delivery and pickup need the columns added by migration 004.
  const open = settings?.pickup_open_hour,
    close = settings?.pickup_close_hour;
  const extras = open != null && close != null;
  const pickup = extras && fulfil === "PICKUP";
  const subtotal = items.reduce((a, i) => a + i.price * i.quantity, 0),
    delivery = pickup ? 0 : deliveryFee(subtotal, settings);
  // Coupons and points need migration 006. These figures are estimates for display;
  // the database recalculates both when it saves the order.
  const pointValue = settings?.point_value;
  const rewards = pointValue != null;
  const discount = Math.min(coupon?.discount || 0, subtotal);
  const usable =
    rewards && pointValue > 0 ? Math.min(points, Math.ceil((subtotal - discount) / pointValue)) : 0;
  const redeemPoints = Math.max(0, Math.min(usable, Math.floor(Number(redeem) || 0)));
  const pointsOff = rewards ? Math.min(redeemPoints * pointValue, subtotal - discount) : 0;
  const total = subtotal - discount - pointsOff + (delivery || 0);
  async function applyCoupon() {
    setCouponBusy(true);
    setCouponError("");
    try {
      setCoupon(
        await api<{ code: string; discount: number }>("/api/coupons/preview", "POST", {
          code: couponInput.trim(),
          items: items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity })),
        }),
      );
    } catch (e) {
      setCoupon(null);
      setCouponError(e instanceof Error ? e.message : "That code could not be applied.");
    } finally {
      setCouponBusy(false);
    }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || savedId) return;
    setBusy(true);
    setError("");
    setFieldErrors({});
    try {
      const form = Object.fromEntries(new FormData(event.currentTarget));
      const text = (key: string) => String(form[key] || "");
      const payload = {
        customer_name: text("customer_name"),
        customer_email: text("customer_email"),
        customer_phone: text("customer_phone"),
        // Stored as one address; the two lines are joined so every existing screen keeps working.
        shipping_address: pickup
          ? ""
          : [text("address_line1"), text("address_line2")]
              .map((line) => line.trim())
              .filter(Boolean)
              .join(", "),
        city: pickup ? "" : text("city"),
        postal_code: pickup ? "" : text("postal_code"),
        fulfillment_method: pickup ? "PICKUP" : "DELIVERY",
        ...(pickup && form.pickup_date && form.pickup_hour
          ? {
              pickup_at: `${text("pickup_date")}T${text("pickup_hour").padStart(2, "0")}:00:00+05:30`,
            }
          : {}),
        payment_method: method,
        ...(coupon ? { coupon_code: coupon.code } : {}),
        ...(redeemPoints > 0 ? { redeem_points: redeemPoints } : {}),
        items: items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity })),
      };
      // Retrying the same cart reuses its key, so a double submit can never create two orders.
      const fingerprint = JSON.stringify(payload);
      if (request.current?.fingerprint !== fingerprint)
        request.current = { fingerprint, key: crypto.randomUUID() };
      const parsed = checkoutSchema.safeParse({ ...payload, idempotency_key: request.current.key });
      if (!parsed.success) {
        setFieldErrors(
          Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])),
        );
        throw new Error("Please check the highlighted details.");
      }
      const { id } = await api<{ id: string }>("/api/orders", "POST", parsed.data);
      setSavedId(id);
      clear();
      if (method === "PAYHERE") {
        await startPayment(id);
      } else {
        window.location.assign(`/orders/${id}?created=1`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to place the order.");
      setBusy(false);
    }
  }
  const fieldError = (key: string) =>
    fieldErrors[key] && <small className="field-error">{fieldErrors[key]}</small>;
  if (!ready) return <p aria-busy="true">Preparing checkout…</p>;
  if (savedId)
    return (
      <div className="empty-state">
        <h2>Your order has been saved.</h2>
        <p>
          {busy
            ? "Taking you to the next step…"
            : "You can continue securely from your order page."}
        </p>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <Link href={`/orders/${savedId}`} className="button">
          Open your order <ArrowRight size={16} />
        </Link>
      </div>
    );
  if (!items.length)
    return (
      <div className="empty-state">
        <h2>Your cart is empty.</h2>
        <p>Add a favourite piece before checking out.</p>
        <Link className="button" href="/products">
          Shop all furniture
        </Link>
      </div>
    );
  const payments: {
    value: PaymentMethod;
    icon: typeof CreditCard;
    tone: string;
    title: string;
    text: string;
  }[] = [
    {
      value: "PAYHERE",
      icon: CreditCard,
      tone: "",
      title: "Pay online with PayHere",
      text: sandbox
        ? "Secure card checkout in the PayHere Sandbox. Test payments only."
        : "Secure card and bank checkout, processed by PayHere.",
    },
    ...(extras
      ? [
          {
            value: "COD" as const,
            icon: Banknote,
            tone: "cash",
            title: pickup ? "Pay at the store" : "Cash on delivery",
            text: pickup
              ? "Pay in cash when you collect your order."
              : "Pay in cash when your furniture arrives.",
          },
        ]
      : []),
    {
      value: "WHATSAPP",
      icon: MessageCircle,
      tone: "whatsapp",
      title: "Order with WhatsApp",
      text: "Save your order, then send the details to arrange payment with our team.",
    },
  ];
  return (
    <form onSubmit={submit} className="checkout-layout">
      <div>
        <section className="form-card">
          <h2>
            <span className="step">1</span> Contact details
          </h2>
          <div className="form-grid">
            <label className="field full">
              Full name
              <input
                name="customer_name"
                autoComplete="name"
                defaultValue={name}
                minLength={2}
                maxLength={100}
                required
              />
              {fieldError("customer_name")}
            </label>
            <label className="field">
              Email address
              <input
                name="customer_email"
                type="email"
                autoComplete="email"
                defaultValue={email}
                maxLength={254}
                required
              />
              {fieldError("customer_email")}
            </label>
            <label className="field">
              Phone number
              <input
                name="customer_phone"
                type="tel"
                autoComplete="tel"
                defaultValue={phone}
                placeholder="0771234567"
                pattern="(\+94|0)[0-9]{9}"
                required
              />
              {fieldError("customer_phone")}
            </label>
          </div>
        </section>
        <section className="form-card">
          <h2>
            <span className="step">2</span> {extras ? "Delivery or pickup" : "Delivery address"}
          </h2>
          {extras && (
            <div className="choice-row">
              <label className={`payment-choice ${!pickup ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="fulfil"
                  checked={!pickup}
                  onChange={() => setFulfil("DELIVERY")}
                />
                <span className="payment-icon">
                  <Truck size={20} />
                </span>
                <span>
                  <strong>Home delivery</strong>
                  <small>Delivered anywhere in Sri Lanka.</small>
                </span>
              </label>
              <label className={`payment-choice ${pickup ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="fulfil"
                  checked={pickup}
                  onChange={() => setFulfil("PICKUP")}
                />
                <span className="payment-icon cash">
                  <Store size={20} />
                </span>
                <span>
                  <strong>Store pickup</strong>
                  <small>Free. Collect at a time you choose.</small>
                </span>
              </label>
            </div>
          )}
          {pickup && extras ? (
            <div className="form-grid">
              {settings?.pickup_address && (
                <p className="info-message full">
                  <strong>Pickup address:</strong> {settings.pickup_address}
                </p>
              )}
              <label className="field">
                Pickup date
                <input
                  name="pickup_date"
                  type="date"
                  min={colomboDate(0)}
                  max={colomboDate(30)}
                  required
                />
                {fieldError("pickup_at")}
              </label>
              <label className="field">
                Pickup time
                <select name="pickup_hour" required defaultValue="">
                  <option value="" disabled>
                    Choose a time
                  </option>
                  {Array.from({ length: close - open }, (_, i) => open + i).map((h) => (
                    <option key={h} value={h}>
                      {hourLabel(h)}
                    </option>
                  ))}
                </select>
                <small>
                  Open {hourLabel(open)} to {hourLabel(close)}, Sri Lanka time.
                </small>
              </label>
            </div>
          ) : (
            <div className="form-grid">
              <label className="field full">
                Address line 1
                <input
                  name="address_line1"
                  defaultValue={address?.line1}
                  autoComplete="address-line1"
                  placeholder="House number and street"
                  minLength={5}
                  maxLength={200}
                  required
                />
                {fieldError("shipping_address")}
              </label>
              <label className="field full">
                Address line 2 (optional)
                <input
                  name="address_line2"
                  defaultValue={address?.line2}
                  autoComplete="address-line2"
                  placeholder="Apartment, floor, landmark"
                  maxLength={190}
                />
              </label>
              <label className="field">
                City
                <input
                  name="city"
                  defaultValue={address?.city}
                  autoComplete="address-level2"
                  maxLength={100}
                  required
                />
                {fieldError("city")}
              </label>
              <label className="field">
                Postal code
                <input
                  name="postal_code"
                  defaultValue={address?.postal}
                  autoComplete="postal-code"
                  inputMode="numeric"
                  pattern="[0-9]{5}"
                  maxLength={5}
                  required
                />
                {fieldError("postal_code")}
              </label>
            </div>
          )}
        </section>
        <section className="form-card">
          <h2>
            <span className="step">3</span> Payment method
          </h2>
          <div className="stack">
            {payments.map(({ value, icon: Icon, tone, title, text }) => (
              <label key={value} className={`payment-choice ${method === value ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="method"
                  value={value}
                  checked={method === value}
                  onChange={() => setMethod(value)}
                />
                <span className={`payment-icon ${tone}`}>
                  <Icon size={20} />
                </span>
                <span>
                  <strong>{title}</strong>
                  <small>{text}</small>
                </span>
              </label>
            ))}
          </div>
        </section>
      </div>
      <aside className="order-summary">
        <h2>Order summary</h2>
        <div className="checkout-items">
          {items.map((i) => (
            <div className="checkout-item" key={i.variant_id}>
              <div className="checkout-thumb">
                <img src={i.image} alt="" />
                <span>{i.quantity}</span>
              </div>
              <div>
                <h3>{i.name}</h3>
                <p>{i.details}</p>
              </div>
              <strong>{money(i.price * i.quantity)}</strong>
            </div>
          ))}
        </div>
        {rewards && (
          <div className="promo-box">
            <label htmlFor="coupon-code">Coupon code</label>
            {coupon ? (
              <p className="promo-applied">
                <TicketPercent size={16} /> <strong>{coupon.code}</strong> applied
                <button
                  type="button"
                  onClick={() => {
                    setCoupon(null);
                    setCouponInput("");
                  }}
                >
                  Remove
                </button>
              </p>
            ) : (
              <div className="promo-row">
                <input
                  id="coupon-code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    if (couponInput.trim().length >= 3) applyCoupon();
                  }}
                  placeholder="Enter code"
                  maxLength={30}
                />
                <button
                  type="button"
                  className="button button-outline button-small"
                  disabled={couponBusy || couponInput.trim().length < 3}
                  onClick={applyCoupon}
                >
                  {couponBusy ? "Checking…" : "Apply"}
                </button>
              </div>
            )}
            {couponError && <small className="field-error">{couponError}</small>}
            {points > 0 && pointValue > 0 && (
              <>
                <label htmlFor="redeem-points">
                  Reward points <span>{points.toLocaleString("en-LK")} available</span>
                </label>
                <div className="promo-row">
                  <input
                    id="redeem-points"
                    type="number"
                    min="0"
                    max={usable}
                    step="1"
                    value={redeem}
                    onChange={(e) => setRedeem(e.target.value)}
                    placeholder="0"
                  />
                  <button
                    type="button"
                    className="button button-outline button-small"
                    onClick={() => setRedeem(String(usable))}
                  >
                    Use max
                  </button>
                </div>
                <small>
                  Each point takes {money(pointValue)} off. You can use up to{" "}
                  {usable.toLocaleString("en-LK")} on this order.
                </small>
              </>
            )}
          </div>
        )}
        <div className="summary-line">
          <span>Subtotal</span>
          <span>{money(subtotal)}</span>
        </div>
        <div className="summary-line">
          <span>{pickup ? "Store pickup" : "Delivery"}</span>
          <span>{pickup ? "Free" : deliveryLabel(delivery)}</span>
        </div>
        {discount > 0 && (
          <div className="summary-line discount">
            <span>Coupon {coupon?.code}</span>
            <span>− {money(discount)}</span>
          </div>
        )}
        {pointsOff > 0 && (
          <div className="summary-line discount">
            <span>{redeemPoints.toLocaleString("en-LK")} reward points</span>
            <span>− {money(pointsOff)}</span>
          </div>
        )}
        <div className="summary-line total">
          <span>Total</span>
          <span>{money(total)}</span>
        </div>
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
        <button className="button" disabled={busy}>
          {busy
            ? "Saving your order…"
            : method === "PAYHERE"
              ? "Continue to PayHere"
              : method === "COD"
                ? "Place order"
                : "Place WhatsApp order"}
          <ArrowRight size={16} />
        </button>
        <p className="summary-note">
          <LockKeyhole size={13} /> Prices and stock are verified on the server before saving.
        </p>
        <Link className="summary-back" href="/cart">
          Edit cart
        </Link>
      </aside>
    </form>
  );
}

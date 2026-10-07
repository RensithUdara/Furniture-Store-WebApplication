"use client";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Store,
  Truck,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useConfirm } from "@/components/dialogs";
import { money, deliveryFee, deliveryLabel } from "@/lib/format";
import { bundleDiscount } from "@/lib/bundles";
import type { Bundle, StoreSettings } from "@/types";
export function CartPage({
  settings,
  bundles = [],
}: {
  settings: StoreSettings | null;
  bundles?: Bundle[];
}) {
  const { items, ready, update, remove, clear, fulfil, setFulfil } = useCart();
  const confirm = useConfirm();
  // Pickup needs the store hours added by migration 004; without them only delivery is offered.
  const canChoose = settings?.pickup_open_hour != null;
  const pickup = canChoose && fulfil === "PICKUP";
  const subtotal = items.reduce((a, i) => a + i.price * i.quantity, 0);
  const delivery = pickup ? 0 : deliveryFee(subtotal, settings);
  const goal = settings?.free_delivery_from || 0;
  // An estimate for display; the database works the set discount out again on the order.
  const sets = bundleDiscount(items, bundles);
  if (!ready)
    return (
      <div className="container page-space" aria-busy="true">
        Opening your bag…
      </div>
    );
  if (!items.length)
    return (
      <div className="container empty-state page-space">
        <ShoppingBag size={36} strokeWidth={1} />
        <h1>A little room for something lovely.</h1>
        <p>Your bag is empty. Find a piece that feels like home.</p>
        <Link className="button" href="/products">
          Explore the collection <ArrowRight size={17} />
        </Link>
      </div>
    );
  return (
    <div className="container page-space">
      <div className="page-heading">
        <span className="eyebrow">Your considered collection</span>
        <h1>The shopping bag.</h1>
        <p>{items.reduce((a, i) => a + i.quantity, 0)} pieces, a little closer to home.</p>
      </div>
      <div className="cart-layout">
        <div>
          {items.map((i) => (
            <article className="cart-line" key={i.variant_id}>
              <Link href={`/products/${i.slug}`}>
                <img src={i.image} alt={i.name} />
              </Link>
              <div>
                <Link href={`/products/${i.slug}`}>
                  <h2>{i.name}</h2>
                </Link>
                <p>
                  {i.details} · {money(i.price)} each
                </p>
                <div className="quantity-control">
                  <button
                    aria-label={`Decrease ${i.name} quantity`}
                    disabled={i.quantity <= 1}
                    onClick={() => update(i.variant_id, i.quantity - 1)}
                  >
                    <Minus size={14} />
                  </button>
                  <span>{i.quantity}</span>
                  <button
                    aria-label={`Increase ${i.name} quantity`}
                    disabled={i.quantity >= Math.min(i.stock, 20)}
                    onClick={() => update(i.variant_id, i.quantity + 1)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div className="cart-line-price">
                <span>{money(i.price * i.quantity)}</span>
                <button
                  className="icon-button"
                  aria-label={`Remove ${i.name}`}
                  onClick={() => remove(i.variant_id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
          <div className="cart-bottom">
            <Link className="text-link" href="/products">
              <ArrowLeft size={15} /> Keep exploring
            </Link>
            <button
              className="text-link"
              onClick={async () => {
                if (
                  await confirm({
                    title: "Empty your cart?",
                    message: "Every item will be removed.",
                    confirmLabel: "Empty cart",
                    tone: "danger",
                  })
                )
                  clear();
              }}
            >
              Empty bag
            </button>
          </div>
        </div>
        <aside className="order-summary">
          <h2>Order summary</h2>
          {goal > 0 && !pickup && (
            <div className="delivery-progress">
              <p>
                {delivery
                  ? `Add ${money(goal - subtotal)} more for free delivery.`
                  : "You've unlocked free delivery."}
              </p>
              <div
                role="progressbar"
                aria-label="Progress to free delivery"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.min(100, Math.round((subtotal / goal) * 100))}
              >
                <span style={{ width: `${Math.min(100, (subtotal / goal) * 100)}%` }} />
              </div>
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
          {sets.amount > 0 && (
            <div className="summary-line discount">
              <span>Set saving ({sets.names.join(", ")})</span>
              <span>− {money(sets.amount)}</span>
            </div>
          )}
          <div className="summary-line total">
            <span>Total</span>
            <span>{money(subtotal - sets.amount + (delivery || 0))}</span>
          </div>
          {canChoose && (
            <fieldset className="fulfil-choice">
              <legend>How would you like to receive your order?</legend>
              <label className={`payment-choice ${fulfil === "DELIVERY" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="fulfil"
                  checked={fulfil === "DELIVERY"}
                  onChange={() => setFulfil("DELIVERY")}
                />
                <span className="payment-icon">
                  <Truck size={18} />
                </span>
                <span>
                  <strong>Home delivery</strong>
                  <small>
                    {deliveryFee(subtotal, settings)
                      ? `${money(settings!.delivery_fee)} islandwide`
                      : "Free for this order"}
                  </small>
                </span>
              </label>
              <label className={`payment-choice ${fulfil === "PICKUP" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="fulfil"
                  checked={fulfil === "PICKUP"}
                  onChange={() => setFulfil("PICKUP")}
                />
                <span className="payment-icon cash">
                  <Store size={18} />
                </span>
                <span>
                  <strong>Store pickup</strong>
                  <small>Free. Choose your date and time at checkout.</small>
                </span>
              </label>
            </fieldset>
          )}
          {canChoose && !fulfil ? (
            <button className="button" disabled>
              Choose delivery or pickup
            </button>
          ) : (
            <Link className="button" href="/checkout">
              Continue to checkout <ArrowRight size={16} />
            </Link>
          )}
          <p className="summary-note">Final price and availability checked at checkout.</p>
        </aside>
      </div>
    </div>
  );
}

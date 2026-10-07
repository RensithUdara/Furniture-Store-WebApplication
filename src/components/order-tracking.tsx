import {
  Ban,
  Check,
  CircleCheckBig,
  Clock,
  CreditCard,
  PackageCheck,
  PackageOpen,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";
import { dateTime } from "@/lib/format";
import type { OrderEvent } from "@/types";
// Shared by the order page and the public Track order page.

const steps = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
const names = {
  delivery: ["Order placed", "Confirmed", "Processing", "Shipped", "Delivered"],
  pickup: ["Order placed", "Confirmed", "Preparing", "Ready for pickup", "Collected"],
};
// The five-stage progress bar. A cancelled order has no bar; the caller shows a notice instead.
export function OrderProgress({ status, pickup }: { status: string; pickup: boolean }) {
  const current = steps.indexOf(status);
  if (current < 0) return null;
  return (
    <ol className="timeline" aria-label="Order progress">
      {steps.map((s, i) => (
        <li
          key={s}
          className={i < current ? "done" : i === current ? "done current" : ""}
          aria-current={i === current ? "step" : undefined}
        >
          <span>{i <= current ? <Check size={14} /> : i + 1}</span>
          {names[pickup ? "pickup" : "delivery"][i]}
        </li>
      ))}
    </ol>
  );
}

// How each recorded event reads to a customer.
function describe(e: OrderEvent, pickup: boolean) {
  switch (e.event) {
    case "PLACED":
      return { icon: ShoppingBag, title: "Order placed", text: "We received your order." };
    case "PAYMENT_PAID":
      return {
        icon: CreditCard,
        title: "Payment received",
        text: "Thank you, your payment is confirmed.",
      };
    case "PAYMENT_FAILED":
      return {
        icon: CreditCard,
        title: "Payment failed",
        text: "The payment did not go through. You can try again from your order page.",
        tone: "warn",
      };
    case "PAYMENT_CANCELLED":
      return {
        icon: CreditCard,
        title: "Payment cancelled",
        text: "The online payment was cancelled before it completed.",
        tone: "warn",
      };
    case "PAYMENT_CHARGEDBACK":
      return {
        icon: CreditCard,
        title: "Payment disputed",
        text: "The payment is under review.",
        tone: "warn",
      };
    case "CONFIRMED":
      return {
        icon: CircleCheckBig,
        title: "Order confirmed",
        text: "Our team has confirmed your order.",
      };
    case "PROCESSING":
      return {
        icon: PackageOpen,
        title: pickup ? "Being prepared" : "Being prepared for delivery",
        text: "Your furniture is being checked and packed.",
      };
    case "SHIPPED":
      return pickup
        ? {
            icon: Store,
            title: "Ready for pickup",
            text: "Your order is waiting for you at the store.",
          }
        : { icon: Truck, title: "Shipped", text: "Your order has left our warehouse." };
    case "DELIVERED":
      return {
        icon: PackageCheck,
        title: pickup ? "Collected" : "Delivered",
        text: "Enjoy your new furniture.",
        tone: "good",
      };
    case "EXPIRED":
      return {
        icon: Clock,
        title: "Payment time ran out",
        text: `The payment was not completed within ${e.detail || "the allowed"} minutes.`,
        tone: "warn",
      };
    case "CANCELLED":
      return {
        icon: Ban,
        title: "Order cancelled",
        text: "Reserved stock was released.",
        tone: "warn",
      };
    case "TRACKING":
      return { icon: Truck, title: "Tracking details updated", text: e.detail };
    default:
      return null;
  }
}
// Every recorded step with its date and time, newest first.
export function TrackingHistory({ events, pickup }: { events: OrderEvent[]; pickup: boolean }) {
  const rows = [...events]
    .reverse()
    .map((e) => ({ e, d: describe(e, pickup) }))
    .filter((r) => r.d);
  if (!rows.length) return null;
  return (
    <section className="history">
      <h2>Tracking history</h2>
      <ol>
        {rows.map(({ e, d }, i) => {
          const Icon = d!.icon;
          return (
            <li key={e.id} className={`${i === 0 ? "latest" : ""} ${d!.tone || ""}`}>
              <span className="history-icon">
                <Icon size={16} />
              </span>
              <div>
                <strong>{d!.title}</strong>
                {d!.text && <p>{d!.text}</p>}
              </div>
              <time dateTime={e.created_at}>{dateTime(e.created_at)}</time>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

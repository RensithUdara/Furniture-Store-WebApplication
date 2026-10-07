"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, startPayment } from "@/lib/client-api";
import type { Order } from "@/types";
export function OrderActions({ order: o, admin = false }: { order: Order; admin?: boolean }) {
  const router = useRouter(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (
      o.payment_method !== "PAYHERE" ||
      o.payment_status !== "PENDING" ||
      o.order_status === "CANCELLED"
    )
      return;
    let count = 0;
    const timer = setInterval(() => {
      router.refresh();
      if (++count >= 10) clearInterval(timer);
    }, 4000);
    return () => clearInterval(timer);
  }, [o.payment_method, o.payment_status, o.order_status, router]);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The action could not be completed.");
    } finally {
      setBusy(false);
    }
  }
  async function status(value: string) {
    await api(`/api/orders/${o.id}/status`, "PATCH", { status: value });
  }
  const next: Record<string, string> = {
    PENDING: "CONFIRMED",
    CONFIRMED: "PROCESSING",
    PROCESSING: "SHIPPED",
    SHIPPED: "DELIVERED",
  };
  const closed = ["DELIVERED", "CANCELLED"].includes(o.order_status);
  const pickup = o.fulfillment_method === "PICKUP";
  const pickupLabels: Record<string, string> = {
    SHIPPED: "ready for pickup",
    DELIVERED: "collected",
  };
  return (
    <>
      {o.requires_review && (
        <div className="error-message" role="alert">
          This order needs a payment review. The store team must reconcile the payment before
          fulfillment.
        </div>
      )}
      <div className="order-actions">
        {!admin &&
          !closed &&
          o.payment_method === "PAYHERE" &&
          !["PAID", "CHARGEDBACK"].includes(o.payment_status) && (
            <button
              className="button"
              disabled={busy}
              onClick={() => run(() => startPayment(o.id))}
            >
              Continue to PayHere
            </button>
          )}
        {!admin && !closed && o.payment_method === "WHATSAPP" && (
          <button
            className="button"
            disabled={busy}
            onClick={() =>
              run(async () => {
                const { url } = await api<{ url: string }>(`/api/orders/${o.id}/whatsapp`);
                window.location.assign(url);
              })
            }
          >
            Open WhatsApp order
          </button>
        )}
        {admin &&
          !closed &&
          !o.requires_review &&
          (o.payment_method !== "PAYHERE" || o.payment_status === "PAID") && (
            <button
              className="button"
              disabled={busy}
              onClick={() => run(() => status(next[o.order_status]))}
            >
              Mark{" "}
              {(pickup && pickupLabels[next[o.order_status]]) ||
                next[o.order_status]?.toLowerCase()}
            </button>
          )}
        {!closed &&
          o.order_status !== "SHIPPED" &&
          (admin || (o.order_status === "PENDING" && o.payment_status !== "PAID")) && (
            <button
              className="button button-outline"
              disabled={busy}
              onClick={() => run(() => status("CANCELLED"))}
            >
              Cancel order
            </button>
          )}
        <button className="text-link" disabled={busy} onClick={() => router.refresh()}>
          Refresh status
        </button>
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

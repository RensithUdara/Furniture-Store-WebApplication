"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Truck } from "lucide-react";
import { api, startPayment } from "@/lib/client-api";
import { Modal, useConfirm } from "@/components/dialogs";
import type { Order } from "@/types";
export function OrderActions({ order: o, admin = false }: { order: Order; admin?: boolean }) {
  const confirm = useConfirm();
  const router = useRouter(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    // The shipping popup: "ship" moves the order to shipped, "edit" only corrects the details.
    [shipping, setShipping] = useState<"ship" | "edit" | null>(null);
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
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "The action could not be completed.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function status(value: string, tracking?: { tracking_number: string; courier: string }) {
    await api(`/api/orders/${o.id}/status`, "PATCH", { status: value, ...tracking });
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
  const upcoming = next[o.order_status];
  const stage = (pickup && pickupLabels[upcoming]) || upcoming?.toLowerCase();
  async function advance() {
    // Shipping a delivery asks for the courier and tracking number instead of a plain yes/no.
    if (upcoming === "SHIPPED" && !pickup) return setShipping("ship");
    if (
      await confirm({
        title: `Mark this order as ${stage}?`,
        message:
          "The customer will see the new status. An order cannot be moved back to an earlier stage.",
        confirmLabel: `Mark ${stage}`,
      })
    )
      run(() => status(upcoming));
  }
  async function saveShipping(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const ok = await run(() =>
      status("SHIPPED", {
        tracking_number: String(form.get("tracking_number") || "").trim(),
        courier: String(form.get("courier") || "").trim(),
      }),
    );
    if (ok) setShipping(null);
  }
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
            <button className="button" disabled={busy} onClick={advance}>
              Mark {stage}
            </button>
          )}
        {admin && !pickup && o.order_status === "SHIPPED" && (
          <button
            className="button button-outline"
            disabled={busy}
            onClick={() => setShipping("edit")}
          >
            <Truck size={16} /> {o.tracking_number ? "Edit tracking" : "Add tracking"}
          </button>
        )}
        {!closed &&
          o.order_status !== "SHIPPED" &&
          (admin || (o.order_status === "PENDING" && o.payment_status !== "PAID")) && (
            <button
              className="button button-outline"
              disabled={busy}
              onClick={async () => {
                if (
                  await confirm({
                    title: "Cancel this order?",
                    message:
                      "The reserved stock goes back on sale, and any coupon or reward points used are returned. This cannot be undone.",
                    confirmLabel: "Cancel order",
                    cancelLabel: "Keep order",
                    tone: "danger",
                  })
                )
                  run(() => status("CANCELLED"));
              }}
            >
              Cancel order
            </button>
          )}
        <button className="text-link" disabled={busy} onClick={() => router.refresh()}>
          Refresh status
        </button>
      </div>
      {error && !shipping && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <Modal
        open={shipping !== null}
        onClose={() => setShipping(null)}
        size="sm"
        title={shipping === "edit" ? "Tracking details" : "Mark as shipped"}
        description={
          shipping === "edit"
            ? "Correct the courier or tracking number the customer sees."
            : "Add the delivery details. The customer sees them on their order page."
        }
      >
        <form className="stack" onSubmit={saveShipping}>
          <label className="field">
            Courier or delivery service
            <input
              name="courier"
              defaultValue={o.courier || ""}
              maxLength={60}
              placeholder="e.g. Prompt Xpress, or Own delivery van"
            />
          </label>
          <label className="field">
            Tracking number
            <input
              name="tracking_number"
              defaultValue={o.tracking_number || ""}
              maxLength={60}
              pattern="[A-Za-z0-9 ./#_\-]*"
              placeholder="e.g. PX-20481563"
              autoFocus
            />
            <small>
              Letters, numbers, spaces and . / # _ - only. Leave both blank if there is nothing to
              track.
            </small>
          </label>
          {shipping === "ship" && (
            <p className="info-message">
              This moves the order to <strong>Shipped</strong>. It cannot be moved back, and a
              shipped order can no longer be cancelled.
            </p>
          )}
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <div className="order-actions">
            <button className="button" disabled={busy}>
              {busy ? "Saving…" : shipping === "edit" ? "Save tracking" : "Mark shipped"}
            </button>
            <button
              type="button"
              className="button button-outline"
              disabled={busy}
              onClick={() => setShipping(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

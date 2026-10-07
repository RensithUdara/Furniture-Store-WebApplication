"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Printer, Undo2 } from "lucide-react";
import { api } from "@/lib/client-api";
import { useConfirm } from "@/components/dialogs";
import { dateTime, money } from "@/lib/format";
import type { Order, Refund } from "@/types";
export function PrintButton() {
  return (
    <button className="button no-print" onClick={() => window.print()}>
      <Printer size={16} /> Print
    </button>
  );
}
// Refunds for a paid order: what has been refunded so far, and a form to refund more.
// A PayHere refund returns the whole payment to the customer's card. A manual refund records
// money staff have already returned another way.
export function RefundPanel({
  order: o,
  refunds,
  payhereReady,
}: {
  order: Order;
  refunds: Refund[];
  // Whether the PayHere refund credentials are set up on the server.
  payhereReady: boolean;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const refunded = Number(o.refunded_amount || 0),
    remaining = Number(o.total_amount) - refunded;
  const viaPayhere = o.payment_method === "PAYHERE" && refunded === 0 && payhereReady;
  const [method, setMethod] = useState<"PAYHERE" | "MANUAL">(viaPayhere ? "PAYHERE" : "MANUAL"),
    [amount, setAmount] = useState(String(remaining)),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const value = method === "PAYHERE" ? remaining : Number(amount);
    if (!(value > 0) || value > remaining)
      return setError(`Enter an amount up to ${money(remaining)}.`);
    if (
      !(await confirm({
        title:
          method === "PAYHERE"
            ? `Refund ${money(value)} through PayHere?`
            : `Record a refund of ${money(value)}?`,
        message:
          method === "PAYHERE"
            ? "The full payment is sent back to the customer’s card. This cannot be undone."
            : "This records money you have already returned to the customer. It does not move any money itself.",
        confirmLabel: method === "PAYHERE" ? "Refund now" : "Record refund",
        tone: "danger",
      }))
    )
      return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/orders/${o.id}/refund`, "POST", {
        method,
        ...(method === "MANUAL" ? { amount: value, reference: form.get("reference") } : {}),
        note: form.get("note"),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The refund could not be completed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="return-panel refund-panel">
      <h2>
        <Undo2 size={18} /> Refunds
      </h2>
      {refunds.length > 0 && (
        <ul className="refund-list">
          {refunds.map((r) => (
            <li key={r.id}>
              <strong>{money(r.amount)}</strong>
              <span>
                {r.method === "PAYHERE" ? "PayHere" : "Manual"}
                {r.reference && ` · ${r.reference}`} · {dateTime(r.created_at)}
                {r.actor_name && ` · ${r.actor_name}`}
              </span>
              {r.note && <small>{r.note}</small>}
            </li>
          ))}
        </ul>
      )}
      {o.payment_status !== "PAID" ? (
        <p className="muted">Only a paid order can be refunded.</p>
      ) : remaining <= 0 ? (
        <p className="success-message">This order has been refunded in full.</p>
      ) : (
        <form className="stack" onSubmit={submit}>
          <p className="muted">
            {refunded > 0
              ? `${money(refunded)} refunded so far; ${money(remaining)} can still be refunded.`
              : `Up to ${money(remaining)} can be refunded.`}
          </p>
          {o.payment_method === "PAYHERE" && (
            <div className="refund-methods">
              <label className={`payment-choice ${method === "PAYHERE" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="method"
                  checked={method === "PAYHERE"}
                  disabled={!viaPayhere}
                  onChange={() => setMethod("PAYHERE")}
                />
                <span>
                  <strong>Refund through PayHere</strong>
                  <small>
                    {viaPayhere
                      ? `Sends the full ${money(remaining)} back to the customer’s card.`
                      : refunded > 0
                        ? "Not available after a part refund; PayHere refunds a payment in full."
                        : "Not set up: add PAYHERE_APP_ID and PAYHERE_APP_SECRET on the server."}
                  </small>
                </span>
              </label>
              <label className={`payment-choice ${method === "MANUAL" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="method"
                  checked={method === "MANUAL"}
                  onChange={() => setMethod("MANUAL")}
                />
                <span>
                  <strong>Record a manual refund</strong>
                  <small>
                    For money already returned by bank transfer, cash, or in the PayHere portal.
                  </small>
                </span>
              </label>
            </div>
          )}
          <div className="form-grid">
            {method === "MANUAL" && (
              <>
                <label className="field">
                  Amount (Rs.)
                  <input
                    type="number"
                    min="0.01"
                    max={remaining}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </label>
                <label className="field">
                  Reference (optional)
                  <input name="reference" maxLength={100} placeholder="Bank transfer number" />
                </label>
              </>
            )}
            <label className="field full">
              Reason (optional)
              <input name="note" maxLength={200} placeholder="Returned: arrived damaged" />
            </label>
          </div>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <div className="order-actions">
            <button className="button" disabled={busy}>
              {busy
                ? "Working…"
                : method === "PAYHERE"
                  ? `Refund ${money(remaining)} through PayHere`
                  : "Record refund"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

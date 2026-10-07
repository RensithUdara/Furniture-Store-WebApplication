"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Pencil, Plus, RotateCcw, Star, Trash2 } from "lucide-react";
import { api } from "@/lib/client-api";
import { Modal, useConfirm } from "@/components/dialogs";
import { dateOnly, dateTime, label } from "@/lib/format";
import type { Address, DeliveryZone, ReturnRequest, StockAlert } from "@/types";
import Link from "next/link";

/* ---------- Address book ---------- */
export function AddressBook({ addresses, zones }: { addresses: Address[]; zones: DeliveryZone[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run(action: () => Promise<unknown>, close = false) {
    setBusy(true);
    setError("");
    try {
      await action();
      router.refresh();
      if (close) setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That change could not be saved.");
    } finally {
      setBusy(false);
    }
  }
  const current = editing && editing !== "new" ? editing : undefined;
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    run(
      () =>
        api("/api/addresses", "POST", {
          id: current?.id,
          label: form.get("label"),
          line1: form.get("line1"),
          line2: form.get("line2") || "",
          city: form.get("city"),
          district: form.get("district") || "",
          postal_code: form.get("postal_code"),
          is_default: form.has("is_default"),
        }),
      true,
    );
  }
  return (
    <>
      {error && !editing && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <div className="address-grid">
        {addresses.map((a) => (
          <article key={a.id} className={`address-card${a.is_default ? " is-default" : ""}`}>
            <header>
              <strong>
                <MapPin size={16} /> {a.label}
              </strong>
              {a.is_default && <span className="status status-paid">Default</span>}
            </header>
            <p>
              {a.line1}
              {a.line2 && (
                <>
                  <br />
                  {a.line2}
                </>
              )}
              <br />
              {a.city} {a.postal_code}
              {a.district && (
                <>
                  <br />
                  {a.district} district
                </>
              )}
            </p>
            <div className="row-actions">
              <button disabled={busy} onClick={() => setEditing(a)}>
                <Pencil size={14} /> Edit
              </button>
              {!a.is_default && (
                <button
                  disabled={busy}
                  onClick={() => run(() => api("/api/addresses", "POST", { ...a, is_default: true }))}
                >
                  <Star size={14} /> Make default
                </button>
              )}
              <button
                disabled={busy}
                onClick={async () => {
                  if (
                    await confirm({
                      title: `Delete the ${a.label} address?`,
                      message: "Orders already placed keep the address they were sent to.",
                      confirmLabel: "Delete address",
                      tone: "danger",
                    })
                  )
                    run(() => api("/api/addresses", "DELETE", { id: a.id }));
                }}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </article>
        ))}
        {addresses.length < 10 && (
          <button className="address-card address-add" onClick={() => setEditing("new")}>
            <Plus size={22} />
            Add an address
          </button>
        )}
      </div>
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={current ? `Edit ${current.label}` : "Add an address"}
      >
        {editing !== null && (
          <form className="stack" key={current?.id || "new"} onSubmit={submit}>
            <label className="field">
              Label
              <input
                name="label"
                defaultValue={current?.label || (addresses.length ? "Office" : "Home")}
                maxLength={40}
                placeholder="Home, Office, Parents"
                required
              />
            </label>
            <label className="field">
              Address line 1
              <input name="line1" defaultValue={current?.line1} minLength={5} maxLength={200} required />
            </label>
            <label className="field">
              Address line 2 (optional)
              <input name="line2" defaultValue={current?.line2} maxLength={190} />
            </label>
            <div className="form-grid">
              <label className="field">
                City
                <input name="city" defaultValue={current?.city} maxLength={100} required />
              </label>
              <label className="field">
                Postal code
                <input
                  name="postal_code"
                  defaultValue={current?.postal_code}
                  inputMode="numeric"
                  pattern="[0-9]{5}"
                  maxLength={5}
                  required
                />
              </label>
              {zones.length > 0 && (
                <label className="field full">
                  District
                  <select name="district" defaultValue={current?.district || ""}>
                    <option value="">Choose a district</option>
                    {zones.map((z) => (
                      <option key={z.district}>{z.district}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <label className="check-label">
              <input
                name="is_default"
                type="checkbox"
                defaultChecked={current?.is_default ?? addresses.length === 0}
              />
              Use as my default delivery address
            </label>
            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
            <div className="order-actions">
              <button className="button" disabled={busy}>
                {busy ? "Saving…" : "Save address"}
              </button>
              <button type="button" className="button button-outline" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

/* ---------- Back-in-stock requests ---------- */
// `admin` shows who is waiting (for the inventory screen); otherwise the customer's own list.
export function StockAlertList({ alerts, admin = false }: { alerts: StockAlert[]; admin?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  if (!alerts.length) return null;
  async function remove(id: string) {
    setBusy(id);
    try {
      await api("/api/stock-alerts", "DELETE", { id });
      router.refresh();
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            {admin && <th>Customer email</th>}
            <th>Requested</th>
            <th>Status</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((a) => {
            const v = a.product_variants;
            const back = Boolean(a.ready_at) || (v?.stock_quantity || 0) > 0;
            return (
              <tr key={a.id}>
                <td>
                  <strong>{v?.products.name || "Product"}</strong>
                  <small>
                    {v?.color} / {v?.material}
                  </small>
                </td>
                {admin && (
                  <td>
                    <a href={`mailto:${a.email}?subject=${encodeURIComponent(`${v?.products.name || "Your item"} is back in stock`)}`}>
                      {a.email}
                    </a>
                  </td>
                )}
                <td>{dateOnly(a.created_at)}</td>
                <td>
                  <span className={`status ${back ? "status-paid" : "status-pending"}`}>
                    {back ? "Back in stock" : "Waiting"}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    {!admin && back && v && <Link href={`/products/${v.products.slug}`}>View</Link>}
                    <button disabled={busy === a.id} onClick={() => remove(a.id)}>
                      {admin ? "Done" : "Remove"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Returns ---------- */
const reasons: Record<ReturnRequest["reason"], string> = {
  DAMAGED: "Arrived damaged",
  FAULTY: "Faulty or defective",
  WRONG_ITEM: "Not what I ordered",
  CHANGED_MIND: "Changed my mind",
  OTHER: "Something else",
};
const tones: Record<ReturnRequest["status"], string> = {
  REQUESTED: "status-pending",
  APPROVED: "status-confirmed",
  REJECTED: "status-cancelled",
  REFUNDED: "status-paid",
};
const explain: Record<ReturnRequest["status"], string> = {
  REQUESTED: "Our team is reviewing your request and will contact you.",
  APPROVED: "Your return is approved. We will arrange collection and your refund.",
  REJECTED: "This request was not approved.",
  REFUNDED: "Your refund has been paid.",
};
export function ReturnPanel({
  orderId,
  request,
  admin = false,
  canRequest,
  windowDays,
}: {
  orderId: string;
  request: ReturnRequest | null;
  admin?: boolean;
  // Delivered, inside the return period, and placed with an account.
  canRequest: boolean;
  windowDays: number;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That could not be saved.");
    } finally {
      setBusy(false);
    }
  }
  async function decide(status: "APPROVED" | "REJECTED" | "REFUNDED", form: HTMLFormElement) {
    const note = String(new FormData(form).get("note") || "");
    const words = { APPROVED: "Approve this return?", REJECTED: "Reject this return?", REFUNDED: "Mark this refund as paid?" };
    if (
      await confirm({
        title: words[status],
        message:
          status === "REFUNDED"
            ? "Only do this after the money has actually been sent. The website does not send refunds itself."
            : "The customer will see your decision and note on their order page. It cannot be changed afterwards.",
        confirmLabel: status === "APPROVED" ? "Approve" : status === "REJECTED" ? "Reject" : "Mark refunded",
        tone: status === "REJECTED" ? "danger" : "default",
      })
    )
      run(() => api("/api/returns", "PATCH", { id: request!.id, status, note }));
  }
  if (!request && (admin || !canRequest)) return null;
  return (
    <section className="return-panel">
      <h2>
        <RotateCcw size={18} /> Return and refund
      </h2>
      {request ? (
        <>
          <p>
            <span className={`status ${tones[request.status]}`}>{label(request.status)}</span>{" "}
            {reasons[request.reason]} · requested {dateTime(request.created_at)}
          </p>
          {request.details && <blockquote>{request.details}</blockquote>}
          {!admin && <p className="muted">{explain[request.status]}</p>}
          {request.admin_note && (
            <p>
              <strong>Store note:</strong> {request.admin_note}
            </p>
          )}
          {admin && ["REQUESTED", "APPROVED"].includes(request.status) && (
            <form className="stack" onSubmit={(e) => e.preventDefault()}>
              <label className="field">
                Note to the customer
                <textarea name="note" maxLength={1000} defaultValue={request.admin_note} />
              </label>
              <div className="order-actions">
                {request.status === "REQUESTED" ? (
                  <>
                    <button className="button" disabled={busy} onClick={(e) => decide("APPROVED", e.currentTarget.form!)}>
                      Approve return
                    </button>
                    <button className="button button-outline" disabled={busy} onClick={(e) => decide("REJECTED", e.currentTarget.form!)}>
                      Reject
                    </button>
                  </>
                ) : (
                  <button className="button" disabled={busy} onClick={(e) => decide("REFUNDED", e.currentTarget.form!)}>
                    Mark refund paid
                  </button>
                )}
              </div>
            </form>
          )}
        </>
      ) : (
        <>
          <p className="muted">
            Something not right? You can request a return within {windowDays} days of delivery.
          </p>
          <button className="button button-outline" onClick={() => setOpen(true)}>
            Request a return
          </button>
        </>
      )}
      {error && !open && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Request a return"
        description="Tell us what went wrong. Our team reviews every request."
      >
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            run(() =>
              api("/api/returns", "POST", {
                order_id: orderId,
                reason: form.get("reason"),
                details: form.get("details") || "",
              }),
            );
          }}
        >
          <label className="field">
            Reason
            <select name="reason" required defaultValue="">
              <option value="" disabled>
                Choose a reason
              </option>
              {Object.entries(reasons).map(([value, name]) => (
                <option key={value} value={value}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            What happened?
            <textarea name="details" maxLength={2000} placeholder="Describe the problem. Which item, and what is wrong with it?" />
          </label>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <div className="order-actions">
            <button className="button" disabled={busy}>
              {busy ? "Sending…" : "Send request"}
            </button>
            <button type="button" className="button button-outline" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

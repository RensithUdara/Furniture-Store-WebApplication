"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/client-api";
import { useConfirm } from "@/components/dialogs";
import { money } from "@/lib/format";
import type { Coupon } from "@/types";
// datetime-local works in the browser's own time zone; convert to and from stored UTC.
const toLocal = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const toIso = (value: FormDataEntryValue | null) =>
  value ? new Date(String(value)).toISOString() : null;
const optional = (value: FormDataEntryValue | null) => (value ? Number(value) : null);
export function CouponForm({ coupon: c, onDone }: { coupon?: Coupon; onDone?: () => void }) {
  const confirm = useConfirm();
  const router = useRouter(),
    formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState(c?.discount_type || "PERCENT"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  async function run(action: () => Promise<unknown>, closeAfter = false) {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await action();
      router.refresh();
      if (closeAfter) onDone?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save the coupon.");
    } finally {
      setBusy(false);
    }
  }
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    run(async () => {
      await api("/api/coupons", "POST", {
        id: c?.id,
        code: String(form.get("code")).trim().toUpperCase(),
        description: form.get("description"),
        discount_type: type,
        discount_value: Number(form.get("discount_value")),
        min_subtotal: Number(form.get("min_subtotal") || 0),
        max_discount: type === "PERCENT" ? optional(form.get("max_discount")) : null,
        starts_at: toIso(form.get("starts_at")),
        ends_at: toIso(form.get("ends_at")),
        usage_limit: optional(form.get("usage_limit")),
        per_user_limit: Number(form.get("per_user_limit") || 1),
        is_active: form.has("is_active"),
      });
      setSaved(true);
      if (!c) formRef.current?.reset();
      onDone?.();
    });
  }
  return (
    <form ref={formRef} onSubmit={submit} className="form-card">
      <h2>
        {c ? c.code : "New coupon"}
        {c && (
          <span className="coupon-summary">
            {c.discount_type === "PERCENT"
              ? `${Number(c.discount_value)}% off`
              : `${money(c.discount_value)} off`}
            {" · used "}
            {c.used_count}
            {c.usage_limit ? ` of ${c.usage_limit}` : " times"}
          </span>
        )}
      </h2>
      <div className="form-grid">
        <label className="field">
          Code
          <input
            name="code"
            defaultValue={c?.code}
            pattern="[A-Za-z0-9_\-]{3,30}"
            placeholder="WELCOME10"
            style={{ textTransform: "uppercase" }}
            required
          />
          <small>3 to 30 letters, numbers, dashes or underscores.</small>
        </label>
        <label className="field">
          Note for staff
          <input name="description" defaultValue={c?.description} maxLength={200} />
        </label>
        <label className="field">
          Discount type
          <select value={type} onChange={(e) => setType(e.target.value as Coupon["discount_type"])}>
            <option value="PERCENT">Percentage off</option>
            <option value="FIXED">Fixed amount off (Rs.)</option>
          </select>
        </label>
        <label className="field">
          {type === "PERCENT" ? "Percentage (1–100)" : "Amount (Rs.)"}
          <input
            name="discount_value"
            type="number"
            min="0.01"
            max={type === "PERCENT" ? 100 : 100000000}
            step="0.01"
            defaultValue={c ? Number(c.discount_value) : ""}
            required
          />
        </label>
        <label className="field">
          Minimum cart subtotal (Rs.)
          <input
            name="min_subtotal"
            type="number"
            min="0"
            step="0.01"
            defaultValue={c ? Number(c.min_subtotal) : 0}
          />
        </label>
        {type === "PERCENT" && (
          <label className="field">
            Maximum discount (Rs., optional)
            <input
              name="max_discount"
              type="number"
              min="0.01"
              step="0.01"
              defaultValue={c?.max_discount ? Number(c.max_discount) : ""}
            />
          </label>
        )}
        <label className="field">
          Starts (optional)
          <input name="starts_at" type="datetime-local" defaultValue={toLocal(c?.starts_at)} />
        </label>
        <label className="field">
          Ends (optional)
          <input name="ends_at" type="datetime-local" defaultValue={toLocal(c?.ends_at)} />
        </label>
        <label className="field">
          Total uses allowed (optional)
          <input
            name="usage_limit"
            type="number"
            min="1"
            step="1"
            defaultValue={c?.usage_limit ?? ""}
          />
        </label>
        <label className="field">
          Uses per customer
          <input
            name="per_user_limit"
            type="number"
            min="1"
            step="1"
            defaultValue={c?.per_user_limit ?? 1}
            required
          />
        </label>
        <label className="check-label">
          <input name="is_active" type="checkbox" defaultChecked={c?.is_active ?? true} />
          Active
        </label>
      </div>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="success-message">
          Coupon saved.
        </p>
      )}
      <div className="order-actions">
        <button className="button" disabled={busy}>
          {busy ? "Saving…" : c ? "Save coupon" : "Create coupon"}
        </button>
        {c && (
          <button
            type="button"
            className="button button-outline"
            disabled={busy}
            onClick={async () => {
              if (
                await confirm({
                  title: `Delete coupon ${c.code}?`,
                  message:
                    "Customers will no longer be able to use this code. Orders that already used it keep their discount.",
                  confirmLabel: "Delete coupon",
                  tone: "danger",
                })
              )
                run(() => api("/api/coupons", "DELETE", { id: c.id }), true);
            }}
          >
            <Trash2 size={15} /> Delete
          </button>
        )}
      </div>
    </form>
  );
}

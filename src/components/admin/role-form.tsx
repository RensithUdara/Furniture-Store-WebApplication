"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/client-api";
import { AREAS } from "@/lib/permissions";
import type { StaffRole } from "@/types";
export function RoleForm({ role: r, members = 0 }: { role?: StaffRole; members?: number }) {
  const router = useRouter(),
    formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await action();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save the role.");
    } finally {
      setBusy(false);
    }
  }
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    run(async () => {
      await api("/api/staff/roles", "POST", {
        id: r?.id,
        name: form.get("name"),
        description: form.get("description"),
        permissions: form.getAll("permissions"),
      });
      setSaved(true);
      if (!r) formRef.current?.reset();
    });
  }
  return (
    <form ref={formRef} onSubmit={submit} className="form-card">
      <h2>
        {r ? r.name : "New role"}
        {r && (
          <span className="coupon-summary">
            {members} {members === 1 ? "person" : "people"}
          </span>
        )}
      </h2>
      <div className="stack">
        <label className="field">
          Role name
          <input name="name" defaultValue={r?.name} required minLength={2} maxLength={60} />
        </label>
        <label className="field">
          What this role is for
          <input name="description" defaultValue={r?.description} maxLength={200} />
        </label>
        <fieldset className="permission-list">
          <legend>Admin areas this role can use</legend>
          {AREAS.map((a) => (
            <label key={a.key} className="permission-option">
              <input
                type="checkbox"
                name="permissions"
                value={a.key}
                defaultChecked={r?.permissions.includes(a.key)}
              />
              <span>
                <strong>{a.name}</strong>
                <small>{a.about}</small>
              </span>
            </label>
          ))}
        </fieldset>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="success-message">
            Role saved. It applies the next time those staff load a page.
          </p>
        )}
        <div className="order-actions">
          <button className="button" disabled={busy}>
            {busy ? "Saving…" : r ? "Save role" : "Create role"}
          </button>
          {r && (
            <button
              type="button"
              className="button button-outline"
              disabled={busy}
              title={members ? "People with this role will be left with no permissions" : undefined}
              onClick={() => run(() => api("/api/staff/roles", "DELETE", { id: r.id }))}
            >
              <Trash2 size={15} /> Delete
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserPlus } from "lucide-react";
import { api } from "@/lib/client-api";
import { Modal, useConfirm } from "@/components/dialogs";
import { dateOnly } from "@/lib/format";
import type { StaffMember, StaffRole } from "@/types";
// The value of the access dropdown: "ADMIN" for full access, otherwise a role id.
const accessOf = (m: StaffMember) => (m.role === "ADMIN" ? "ADMIN" : m.staff_role_id || "");
function AccessOptions({ roles }: { roles: StaffRole[] }) {
  return (
    <>
      <optgroup label="Staff roles">
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </optgroup>
      <optgroup label="Full access">
        <option value="ADMIN">Administrator (everything, including staff)</option>
      </optgroup>
    </>
  );
}
export function StaffManager({
  staff,
  roles,
  currentId,
}: {
  staff: StaffMember[];
  roles: StaffRole[];
  currentId: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const confirm = useConfirm();
  const [adding, setAdding] = useState(false);
  const accessName = (access: string) =>
    access === "ADMIN"
      ? "Administrator (full access)"
      : roles.find((r) => r.id === access)?.name || "this role";
  const [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  async function run(key: string, action: () => Promise<string>) {
    setBusy(key);
    setError("");
    setMessage("");
    try {
      setMessage(await action());
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That change could not be saved.");
    } finally {
      setBusy("");
    }
  }
  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    const ok = await confirm({
      title: "Create this staff account?",
      message: (
        <>
          <strong>{String(form.name)}</strong> ({String(form.email)}) will be able to sign in to the
          admin panel straight away as <strong>{accessName(String(form.access))}</strong>.
        </>
      ),
      confirmLabel: "Create account",
    });
    if (!ok) return;
    run("create", async () => {
      await api("/api/staff", "POST", form);
      formRef.current?.reset();
      setAdding(false);
      return `Account created for ${form.email}. Share the password with them privately.`;
    });
  }
  async function change(member: StaffMember, access: string) {
    const who = member.name || member.email;
    const ok = await confirm(
      access === "NONE"
        ? {
            title: `Remove ${who}'s access?`,
            message:
              "They will be signed out of the admin panel and become a normal customer account. Their own order history is kept.",
            confirmLabel: "Remove access",
            tone: "danger",
          }
        : {
            title: `Change ${who}'s access?`,
            message: `They will become ${accessName(access)} the next time they load a page.`,
            confirmLabel: "Change access",
          },
    );
    if (!ok) return;
    run(member.id, async () => {
      await api("/api/staff", "PATCH", { id: member.id, access });
      return access === "NONE"
        ? `${member.name || member.email} no longer has staff access.`
        : `Access updated for ${member.name || member.email}.`;
    });
  }
  return (
    <>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="success-message" role="status">
          {message}
        </p>
      )}
      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add staff account"
        description="Create a login for someone on your team."
      >
        <form ref={formRef} onSubmit={create} className="form-card">
          <p>
            The account can sign in at <code>/admin</code> straight away. They can change the
            password themselves under Account → Security.
          </p>
          <div className="form-grid">
            <label className="field">
              Full name
              <input name="name" required minLength={2} maxLength={100} autoComplete="off" />
            </label>
            <label className="field">
              Email address
              <input name="email" type="email" required maxLength={254} autoComplete="off" />
            </label>
            <label className="field">
              Temporary password
              <input
                name="password"
                type="text"
                required
                minLength={8}
                maxLength={128}
                autoComplete="off"
              />
              <small>At least 8 characters.</small>
            </label>
            <label className="field">
              Access
              <select name="access" required defaultValue={roles[0]?.id || "ADMIN"}>
                <AccessOptions roles={roles} />
              </select>
            </label>
          </div>
          <div className="order-actions">
            <button className="button" disabled={busy === "create"}>
              {busy === "create" ? "Creating…" : "Create account"}
            </button>
            <button
              type="button"
              className="button button-outline"
              onClick={() => setAdding(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
      <div className="catalog-tools">
        <h2 className="tools-title">
          <ShieldCheck size={19} /> {staff.length} {staff.length === 1 ? "person" : "people"} with
          admin access
        </h2>
        <button className="button" onClick={() => setAdding(true)}>
          <UserPlus size={16} /> Add staff
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Since</th>
              <th>Access</th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {staff.map((m) => {
              const self = m.id === currentId;
              return (
                <tr key={m.id}>
                  <td>
                    <strong>{m.name || "—"}</strong>
                    {self && <small>You</small>}
                  </td>
                  <td>{m.email}</td>
                  <td>{dateOnly(m.created_at)}</td>
                  <td>
                    {self ? (
                      <span className="status status-paid">Administrator</span>
                    ) : (
                      <select
                        aria-label={`Access for ${m.name || m.email}`}
                        value={accessOf(m)}
                        disabled={busy === m.id}
                        onChange={(e) => change(m, e.target.value)}
                      >
                        {!accessOf(m) && <option value="">No role (no permissions)</option>}
                        <AccessOptions roles={roles} />
                      </select>
                    )}
                  </td>
                  <td>
                    {!self && (
                      <div className="row-actions">
                        <button disabled={busy === m.id} onClick={() => change(m, "NONE")}>
                          Remove access
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

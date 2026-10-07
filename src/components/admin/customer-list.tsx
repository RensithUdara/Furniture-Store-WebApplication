"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { api } from "@/lib/client-api";
import { Modal } from "@/components/dialogs";
import { dateOnly, money } from "@/lib/format";
import type { Customer } from "@/types";
const sorts = {
  recent: [
    "Most recent order",
    (a: Customer, b: Customer) => (b.last_order_at || "").localeCompare(a.last_order_at || ""),
  ],
  spent: ["Highest spend", (a: Customer, b: Customer) => b.total_spent - a.total_spent],
  orders: ["Most orders", (a: Customer, b: Customer) => b.order_count - a.order_count],
  points: ["Most points", (a: Customer, b: Customer) => b.loyalty_points - a.loyalty_points],
  name: ["Name", (a: Customer, b: Customer) => a.name.localeCompare(b.name)],
} as const;
function PointsForm({ customer: c, onDone }: { customer: Customer; onDone: () => void }) {
  const router = useRouter();
  const [direction, setDirection] = useState<"add" | "remove">("add"),
    [amount, setAmount] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const points = Math.floor(Number(amount) || 0);
  const after = c.loyalty_points + (direction === "add" ? points : -points);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (points <= 0) return setError("Enter a number of points.");
    if (after < 0) return setError(`This customer only has ${c.loyalty_points} points.`);
    setBusy(true);
    setError("");
    try {
      await api("/api/customers/points", "POST", {
        user_id: c.id,
        points: direction === "add" ? points : -points,
        note: new FormData(e.currentTarget).get("note"),
      });
      router.refresh();
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to adjust the points.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form-card" onSubmit={submit}>
      <dl className="spec-list">
        <div>
          <dt>Email</dt>
          <dd>{c.email}</dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>{c.phone || "Not given"}</dd>
        </div>
        <div>
          <dt>Orders</dt>
          <dd>
            {c.order_count} · {money(c.total_spent)} paid
          </dd>
        </div>
        <div>
          <dt>Reward points</dt>
          <dd>{c.loyalty_points.toLocaleString("en-LK")}</dd>
        </div>
      </dl>
      <h3>Adjust reward points</h3>
      <div className="form-grid">
        <label className="field">
          Change
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as "add" | "remove")}
          >
            <option value="add">Add points</option>
            <option value="remove">Remove points</option>
          </select>
        </label>
        <label className="field">
          Points
          <input
            type="number"
            min="1"
            max="1000000"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>
        <label className="field full">
          Reason
          <input
            name="note"
            minLength={3}
            maxLength={200}
            placeholder="Goodwill for a late delivery"
            required
          />
          <small>Saved with the adjustment and shown in the activity log.</small>
        </label>
      </div>
      {points > 0 && after >= 0 && (
        <p className="info-message">
          The balance will go from {c.loyalty_points.toLocaleString("en-LK")} to{" "}
          <strong>{after.toLocaleString("en-LK")}</strong> points.
        </p>
      )}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <div className="order-actions">
        <button className="button" disabled={busy}>
          {busy ? "Saving…" : direction === "add" ? "Add points" : "Remove points"}
        </button>
      </div>
    </form>
  );
}
export function CustomerList({ customers }: { customers: Customer[] }) {
  const [query, setQuery] = useState(""),
    [sort, setSort] = useState<keyof typeof sorts>("recent"),
    [selected, setSelected] = useState<Customer | null>(null);
  const q = query.trim().toLowerCase();
  const rows = customers
    .filter((c) => `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q))
    .sort(sorts[sort][1]);
  return (
    <>
      <div className="catalog-tools">
        <div className="search-field">
          <Search size={18} />
          <input
            aria-label="Search customers"
            placeholder="Search by name, email or phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <label className="sort-label">
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value as keyof typeof sorts)}>
            {Object.entries(sorts).map(([key, [name]]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {rows.length ? (
        <div className="table-wrap">
          <table className="clickable-rows">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Orders</th>
                <th>Total spent</th>
                <th>Reward points</th>
                <th>Last order</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.id}
                  tabIndex={0}
                  aria-label={`Open ${c.name || c.email}`}
                  onClick={() => setSelected(c)}
                  onKeyDown={(e) => e.key === "Enter" && setSelected(c)}
                >
                  <td>
                    <strong>{c.name || "No name"}</strong>
                    {c.role !== "CUSTOMER" && (
                      <span className="status">{c.role.toLowerCase()}</span>
                    )}
                    <small>{c.email}</small>
                  </td>
                  <td>{c.order_count}</td>
                  <td>{money(c.total_spent)}</td>
                  <td>{c.loyalty_points.toLocaleString("en-LK")}</td>
                  <td>{c.last_order_at ? dateOnly(c.last_order_at) : "Never"}</td>
                  <td>{dateOnly(c.joined_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="info-message">No customers match your search.</p>
      )}
      <p className="muted small-print">
        {rows.length} of {customers.length} accounts. Total spent counts paid orders, less refunds.
      </p>
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name || selected?.email || "Customer"}
      >
        {selected && (
          <PointsForm key={selected.id} customer={selected} onDone={() => setSelected(null)} />
        )}
      </Modal>
    </>
  );
}

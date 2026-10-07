"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Trash2 } from "lucide-react";
import { api } from "@/lib/client-api";
import { useConfirm } from "@/components/dialogs";
import { dateOnly } from "@/lib/format";
import type { Subscriber } from "@/types";
export function SubscriberList({ subscribers }: { subscribers: Subscriber[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [query, setQuery] = useState(""),
    [error, setError] = useState("");
  const rows = subscribers.filter((s) => s.email.includes(query.trim().toLowerCase()));
  async function remove(s: Subscriber) {
    if (
      !(await confirm({
        title: `Remove ${s.email}?`,
        message: "The address is deleted from the list. They can subscribe again themselves.",
        confirmLabel: "Remove",
        tone: "danger",
      }))
    )
      return;
    try {
      await api("/api/newsletter", "DELETE", { id: s.id });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to remove the address.");
    }
  }
  return (
    <>
      <div className="catalog-tools">
        <div className="search-field">
          <Search size={18} />
          <input
            aria-label="Search subscribers"
            placeholder="Search by email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {rows.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Subscribed on</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className={s.unsubscribed_at ? "is-muted" : ""}>
                  <td>
                    <strong>{s.email}</strong>
                  </td>
                  <td>{dateOnly(s.created_at)}</td>
                  <td>
                    <span className={`status ${s.unsubscribed_at ? "" : "status-paid"}`}>
                      {s.unsubscribed_at ? "Unsubscribed" : "Subscribed"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      aria-label={`Remove ${s.email}`}
                      onClick={() => remove(s)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="info-message">
          {subscribers.length ? "No address matches your search." : "Nobody has subscribed yet."}
        </p>
      )}
    </>
  );
}

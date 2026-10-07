"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import type { DeliveryZone } from "@/types";
// Delivery time to each district, in days. Customers see the resulting dates at checkout.
export function ZoneEditor({ zones: initial }: { zones: DeliveryZone[] }) {
  const router = useRouter();
  const [zones, setZones] = useState(initial);
  // The fee column arrives with migration 013.
  const fees = initial.some((z) => z.fee !== undefined);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  const change = (district: string, patch: Partial<DeliveryZone>) =>
    setZones((list) => list.map((z) => (z.district === district ? { ...z, ...patch } : z)));
  async function save() {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await api("/api/zones", "PUT", { zones });
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save delivery times.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="form-card">
      <h2>{fees ? "Delivery time and fee by district" : "Delivery time by district"}</h2>
      <p>
        The shortest and longest number of days delivery usually takes. Untick a district to stop
        offering delivery there.
        {fees &&
          " Give a district its own delivery fee, or leave the fee empty to charge the standard one. Orders above the free-delivery amount are still delivered free."}
      </p>
      <div className="table-wrap zone-table">
        <table>
          <thead>
            <tr>
              <th>District</th>
              <th>From (days)</th>
              <th>To (days)</th>
              {fees && <th>Delivery fee (Rs.)</th>}
              <th>Deliver here</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.district} className={z.is_active ? "" : "is-muted"}>
                <td>
                  <strong>{z.district}</strong>
                </td>
                {(["min_days", "max_days"] as const).map((field) => (
                  <td key={field}>
                    <input
                      type="number"
                      min="0"
                      max="90"
                      aria-label={`${field === "min_days" ? "Shortest" : "Longest"} delivery days to ${z.district}`}
                      value={z[field]}
                      onChange={(e) => change(z.district, { [field]: Number(e.target.value) })}
                    />
                  </td>
                ))}
                {fees && (
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="zone-fee"
                      placeholder="Standard"
                      aria-label={`Delivery fee to ${z.district}`}
                      value={z.fee ?? ""}
                      onChange={(e) =>
                        change(z.district, {
                          fee: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                  </td>
                )}
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Deliver to ${z.district}`}
                    checked={z.is_active}
                    onChange={(e) => change(z.district, { is_active: e.target.checked })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="success-message" role="status">
          Delivery times saved.
        </p>
      )}
      <div className="order-actions">
        <button type="button" className="button" disabled={busy} onClick={save}>
          {busy ? "Saving…" : "Save delivery times"}
        </button>
      </div>
    </section>
  );
}

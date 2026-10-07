"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import type { StoreSettings } from "@/types";
export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  // Contact and pickup fields exist once migration 004 has been run.
  const extras = settings.pickup_open_hour != null;
  // Loyalty settings exist once migration 006 has been run.
  const rewards = settings.points_per_100 != null;
  // The unpaid-order setting exists once migration 010 has been run.
  const expiry = settings.unpaid_expiry_minutes != null;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const form = new FormData(e.currentTarget);
      await api("/api/settings", "PATCH", {
        delivery_fee: Number(form.get("delivery_fee")),
        free_delivery_from: Number(form.get("free_delivery_from")),
        ...(extras
          ? {
              store_phone: form.get("store_phone"),
              pickup_address: form.get("pickup_address"),
              pickup_open_hour: Number(form.get("pickup_open_hour")),
              pickup_close_hour: Number(form.get("pickup_close_hour")),
            }
          : {}),
        ...(expiry ? { unpaid_expiry_minutes: Number(form.get("unpaid_expiry_minutes")) } : {}),
        ...(rewards
          ? {
              points_per_100: Number(form.get("points_per_100")),
              point_value: Number(form.get("point_value")),
            }
          : {}),
      });
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save settings.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <section className="form-card">
        <h2>Delivery pricing</h2>
        <p>
          Applied by the database when an order is created. Existing orders keep the fee they were
          placed with.
        </p>
        <div className="form-grid">
          <label className="field">
            Delivery fee (Rs.)
            <input
              name="delivery_fee"
              type="number"
              min="0"
              max="1000000"
              step="0.01"
              defaultValue={settings.delivery_fee}
              required
            />
          </label>
          <label className="field">
            Free delivery from (Rs.)
            <input
              name="free_delivery_from"
              type="number"
              min="0"
              max="100000000"
              step="0.01"
              defaultValue={settings.free_delivery_from}
              required
            />
            <small>Orders at or above this subtotal are delivered free.</small>
          </label>
        </div>
      </section>
      {extras ? (
        <section className="form-card">
          <h2>Contact and store pickup</h2>
          <p>Shown in the header, footer, checkout, and order pages.</p>
          <div className="form-grid">
            <label className="field">
              Store phone
              <input
                name="store_phone"
                type="tel"
                defaultValue={settings.store_phone}
                maxLength={30}
                placeholder="011 234 5678"
              />
            </label>
            <label className="field">
              Pickup address
              <input
                name="pickup_address"
                defaultValue={settings.pickup_address}
                maxLength={300}
                placeholder="Showroom address customers collect from"
              />
            </label>
            <label className="field">
              Pickup opens (hour, 0–23)
              <input
                name="pickup_open_hour"
                type="number"
                min="0"
                max="23"
                defaultValue={settings.pickup_open_hour}
                required
              />
            </label>
            <label className="field">
              Pickup closes (hour, 1–24)
              <input
                name="pickup_close_hour"
                type="number"
                min="1"
                max="24"
                defaultValue={settings.pickup_close_hour}
                required
              />
              <small>Sri Lanka time. Customers choose an hourly slot between these.</small>
            </label>
          </div>
        </section>
      ) : (
        <div className="info-message">
          Run <code>supabase/migrations/004_storefront.sql</code> to add contact details, store
          pickup, cash on delivery, sub-categories, and promo slides.
        </div>
      )}
      {expiry && (
        <section className="form-card">
          <h2>Unpaid online orders</h2>
          <p>
            A PayHere order holds its stock while the customer pays. If the payment is not completed
            in time, the order is cancelled automatically and the items go back on sale. Cash and
            WhatsApp orders are never cancelled automatically.
          </p>
          <div className="form-grid">
            <label className="field">
              Cancel after (minutes)
              <input
                name="unpaid_expiry_minutes"
                type="number"
                min="0"
                max="10080"
                step="1"
                defaultValue={settings.unpaid_expiry_minutes}
                required
              />
              <small>Enter 0 to switch automatic cancelling off. 60 is one hour.</small>
            </label>
          </div>
        </section>
      )}
      {rewards ? (
        <section className="form-card">
          <h2>Reward points</h2>
          <p>
            Customers earn points when an order is delivered or collected, and spend them at
            checkout. Set either value to 0 to pause earning or redeeming.
          </p>
          <div className="form-grid">
            <label className="field">
              Points earned per Rs. 100 paid
              <input
                name="points_per_100"
                type="number"
                min="0"
                max="100"
                step="1"
                defaultValue={settings.points_per_100}
                required
              />
            </label>
            <label className="field">
              Value of one point at checkout (Rs.)
              <input
                name="point_value"
                type="number"
                min="0"
                max="1000"
                step="0.01"
                defaultValue={settings.point_value}
                required
              />
            </label>
          </div>
        </section>
      ) : (
        <div className="info-message">
          Run <code>supabase/migrations/006_rewards.sql</code> to add the wishlist, coupons, and
          reward points.
        </div>
      )}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="success-message" role="status">
          Settings saved.
        </p>
      )}
      <div className="order-actions">
        <button className="button" disabled={busy}>
          {busy ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}

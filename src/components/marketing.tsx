"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Mail, Timer, Zap } from "lucide-react";
import { api } from "@/lib/client-api";
const two = (n: number) => String(n).padStart(2, "0");
// Time left until a flash sale ends, ticking every second. It appears once the page is running
// in the browser (the server cannot know the visitor's clock), and when it reaches zero the
// page reloads its data so the sale prices disappear.
export function Countdown({ ends, compact = false }: { ends: string; compact?: boolean }) {
  const router = useRouter();
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const end = Date.parse(ends);
    const tick = () => {
      const ms = end - Date.now();
      setLeft(Math.max(0, ms));
      if (ms <= 0) {
        clearInterval(timer);
        router.refresh();
      }
    };
    const timer = setInterval(tick, 1000);
    tick();
    return () => clearInterval(timer);
  }, [ends, router]);
  if (left === null || left <= 0) return null;
  const s = Math.floor(left / 1000),
    d = Math.floor(s / 86400),
    h = Math.floor((s % 86400) / 3600),
    m = Math.floor((s % 3600) / 60);
  if (compact)
    return (
      <span className="countdown-compact">
        <Timer size={13} /> Ends in{" "}
        {d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${two(m)}m` : `${m}m ${two(s % 60)}s`}
      </span>
    );
  const parts = [
    ...(d > 0 ? [[d, "days"]] : []),
    [two(h), "hrs"],
    [two(m), "min"],
    [two(s % 60), "sec"],
  ];
  return (
    <span
      className="countdown"
      role="timer"
      aria-label={`Ends in ${d} days ${h} hours ${m} minutes`}
    >
      {parts.map(([value, unit]) => (
        <span key={unit}>
          <b>{value}</b>
          <small>{unit}</small>
        </span>
      ))}
    </span>
  );
}
export function FlashBanner({
  name,
  percent,
  ends,
}: {
  name: string;
  percent: number;
  ends: string;
}) {
  return (
    <section className="flash-banner">
      <div className="container">
        <div>
          <span className="eyebrow">
            <Zap size={14} /> Flash sale
          </span>
          <h2>
            {name}: up to {percent}% off
          </h2>
        </div>
        <div className="flash-banner-timer">
          <small>Ends in</small>
          <Countdown ends={ends} />
        </div>
        <Link className="button" href="/products?sale=1">
          Shop the sale <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}
export function NewsletterForm() {
  const [busy, setBusy] = useState(false),
    [done, setDone] = useState(false),
    [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/newsletter", "POST", { email: new FormData(e.currentTarget).get("email") });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to subscribe. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="newsletter">
      <h3>
        <Mail size={17} /> New arrivals and offers by email
      </h3>
      {done ? (
        <p className="newsletter-done" role="status">
          <Check size={16} /> You are subscribed. Thank you.
        </p>
      ) : (
        <form onSubmit={submit}>
          <input
            name="email"
            type="email"
            aria-label="Email address"
            placeholder="you@example.com"
            autoComplete="email"
            maxLength={254}
            required
          />
          <button className="button" disabled={busy}>
            {busy ? "…" : "Subscribe"}
          </button>
        </form>
      )}
      {error && (
        <p className="newsletter-error" role="alert">
          {error}
        </p>
      )}
      {!done && <small>Occasional emails. Unsubscribe with one click at any time.</small>}
    </div>
  );
}

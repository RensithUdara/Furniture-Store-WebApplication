"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import { api } from "@/lib/client-api";
// Dedicated sign-in for the store team at /admin. It uses the same Supabase Auth accounts;
// what makes someone an admin is the role on their profile, checked on the server.
export function AdminLogin({ notAdmin }: { notAdmin: boolean }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/auth/login", "POST", Object.fromEntries(new FormData(event.currentTarget)));
      window.location.assign("/admin");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
      setBusy(false);
    }
  }
  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <span className="wordmark">
          forma<span>& co.</span>
        </span>
        <span className="admin-login-badge">
          <ShieldCheck size={15} /> Store administration
        </span>
        <h1>Admin sign in</h1>
        <p>For store staff only. Customers sign in from the store.</p>
        {notAdmin && (
          <div className="error-message" role="alert">
            This account does not have staff access. Sign in with a staff account.
          </div>
        )}
        <form className="stack" onSubmit={submit}>
          <label className="field">
            Email address
            <input name="email" type="email" autoComplete="username" required maxLength={254} />
          </label>
          <label className="field">
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              maxLength={128}
            />
          </label>
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
          <button className="button" disabled={busy}>
            <LockKeyhole size={16} /> {busy ? "Signing in…" : "Sign in to admin"}
          </button>
        </form>
        <Link className="back-link" href="/">
          <ArrowLeft size={15} /> Back to the store
        </Link>
      </div>
    </div>
  );
}

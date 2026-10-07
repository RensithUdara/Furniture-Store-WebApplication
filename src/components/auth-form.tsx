"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import { safeNext } from "@/lib/format";
import { navigate } from "@/components/navigation-progress";
export function AuthForm({
  mode,
  configured,
  next = "/account",
  confirmationError = false,
}: {
  mode: "login" | "register";
  configured: boolean;
  next?: string;
  confirmationError?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState(
    confirmationError
      ? "That confirmation link could not be verified. Please request a fresh registration email."
      : "",
  );
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await api<{ confirmationRequired?: boolean }>(
        `/api/auth/${mode}`,
        "POST",
        Object.fromEntries(new FormData(event.currentTarget)),
      );
      if (result.confirmationRequired) {
        setMessage("Check your email to confirm your account, then sign in.");
      } else {
        navigate(router.push, safeNext(next));
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <div className="auth-image">
        <img src="/images/living.jpg" alt="A thoughtful living room" />
        <div>
          <h2>
            A space that feels
            <br />
            <em>like you.</em>
          </h2>
        </div>
      </div>
      <div className="auth-form">
        <span className="eyebrow">A little more at home</span>
        <h1>{mode === "login" ? "Welcome back." : "Make yourself at home."}</h1>
        <p>
          {mode === "login"
            ? "Sign in to check out and keep track of your orders."
            : "Create an account for a more considered shopping experience."}
        </p>
        {!configured && (
          <div className="info-message">
            Accounts will be available when the store is connected to Supabase.
          </div>
        )}
        <form className="stack" onSubmit={submit}>
          {mode === "register" && (
            <label className="field">
              Your name
              <input name="name" autoComplete="name" required minLength={2} maxLength={100} />
            </label>
          )}
          <label className="field">
            Email address
            <input name="email" type="email" autoComplete="email" required maxLength={254} />
          </label>
          <label className="field">
            Password
            <input
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={8}
              maxLength={128}
            />
            {mode === "register" && <small>At least 8 characters.</small>}
          </label>
          {mode === "login" && (
            <Link className="forgot-link" href="/forgot-password">
              Forgot your password?
            </Link>
          )}
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
          {message && (
            <div className="success-message" role="status">
              {message}
            </div>
          )}
          <button className="button" disabled={busy || !configured}>
            {busy ? "One moment…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
        <p className="auth-link">
          {mode === "login" ? "New here? " : "Already at home? "}
          <Link
            href={`/${mode === "login" ? "register" : "login"}?next=${encodeURIComponent(next)}`}
          >
            {mode === "login" ? "Create an account" : "Sign in"}
          </Link>
        </p>
      </div>
    </div>
  );
}

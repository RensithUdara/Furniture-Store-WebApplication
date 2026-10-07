"use client";
import { useState } from "react";
import { api } from "@/lib/client-api";
export function LogoutButton() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <>
      <button
        className="button button-outline"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await api("/api/auth/logout", "POST");
            window.location.assign("/");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Unable to sign out.");
            setBusy(false);
          }
        }}
      >
        {busy ? "Signing out…" : "Sign out"}
      </button>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
    </>
  );
}

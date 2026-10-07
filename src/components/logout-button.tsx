"use client";
import { useState } from "react";
import { api } from "@/lib/client-api";
import { useConfirm } from "@/components/dialogs";
export function LogoutButton() {
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <>
      <button
        className="button button-outline"
        disabled={busy}
        onClick={async () => {
          const ok = await confirm({
            title: "Sign out?",
            message: "You will need your email and password to sign in again.",
            confirmLabel: "Sign out",
          });
          if (!ok) return;
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

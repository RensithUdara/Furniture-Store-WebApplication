"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import { useConfirm } from "@/components/dialogs";
import { addressSchema, emailSchema, passwordSchema, profileSchema } from "@/lib/validation";
function useSubmit() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setDone(false);
    try {
      await action();
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, done, run };
}
function Feedback({ error, done, text }: { error: string; done: boolean; text: string }) {
  return (
    <>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {done && (
        <p className="success-message" role="status">
          {text}
        </p>
      )}
    </>
  );
}
const parse = <T,>(
  schema: {
    safeParse: (v: unknown) => {
      success: boolean;
      data?: T;
      error?: { issues: { message: string }[] };
    };
  },
  value: unknown,
) => {
  const result = schema.safeParse(value);
  if (!result.success) throw new Error(result.error!.issues.map((i) => i.message).join(". "));
  return result.data as T;
};
export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const router = useRouter();
  const { busy, error, done, run } = useSubmit();
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        const values = Object.fromEntries(new FormData(e.currentTarget));
        run(async () => {
          await api("/api/profile", "PATCH", parse(profileSchema, values));
          router.refresh();
        });
      }}
    >
      <label className="field">
        Full name
        <input name="name" defaultValue={name} autoComplete="name" required maxLength={100} />
      </label>
      <label className="field">
        Phone number
        <input
          name="phone"
          type="tel"
          defaultValue={phone}
          autoComplete="tel"
          placeholder="0771234567"
          pattern="(\+94|0)[0-9]{9}"
        />
        <small>Used to pre-fill checkout.</small>
      </label>
      <Feedback error={error} done={done} text="Profile saved." />
      <button className="button" disabled={busy}>
        {busy ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
export function PasswordForm() {
  const { busy, error, done, run } = useSubmit();
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const { password, confirm } = Object.fromEntries(new FormData(form));
        run(async () => {
          if (password !== confirm) throw new Error("The two passwords do not match.");
          await api("/api/auth/password", "POST", parse(passwordSchema, { password }));
          form.reset();
        });
      }}
    >
      <label className="field">
        New password
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
        />
        <small>At least 8 characters.</small>
      </label>
      <label className="field">
        Confirm new password
        <input
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
        />
      </label>
      <Feedback error={error} done={done} text="Password updated." />
      <button className="button" disabled={busy}>
        {busy ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
export function ResetRequestForm({ configured }: { configured: boolean }) {
  const { busy, error, done, run } = useSubmit();
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        const values = Object.fromEntries(new FormData(e.currentTarget));
        run(() => api("/api/auth/reset", "POST", parse(emailSchema, values)).then(() => {}));
      }}
    >
      <label className="field">
        Email address
        <input name="email" type="email" autoComplete="email" required maxLength={254} />
      </label>
      <Feedback
        error={error}
        done={done}
        text="If that address has an account, a reset link is on its way. Check your inbox."
      />
      <button className="button" disabled={busy || !configured}>
        {busy ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
type Address = { address_line1: string; address_line2: string; city: string; postal_code: string };
export function AddressForm({ address }: { address: Address }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { busy, error, done, run } = useSubmit();
  const save = (values: unknown) =>
    run(async () => {
      await api("/api/profile", "PATCH", parse(addressSchema, values));
      router.refresh();
    });
  return (
    <form
      // Re-create the fields after a save or removal so they show what is stored.
      key={JSON.stringify(address)}
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        save(Object.fromEntries(new FormData(e.currentTarget)));
      }}
    >
      <label className="field">
        Address line 1
        <input
          name="address_line1"
          defaultValue={address.address_line1}
          autoComplete="address-line1"
          placeholder="House number and street"
          maxLength={200}
          required
        />
      </label>
      <label className="field">
        Address line 2 (optional)
        <input
          name="address_line2"
          defaultValue={address.address_line2}
          autoComplete="address-line2"
          placeholder="Apartment, floor, landmark"
          maxLength={190}
        />
      </label>
      <div className="form-grid">
        <label className="field">
          City
          <input
            name="city"
            defaultValue={address.city}
            autoComplete="address-level2"
            maxLength={100}
            required
          />
        </label>
        <label className="field">
          Postal code
          <input
            name="postal_code"
            defaultValue={address.postal_code}
            autoComplete="postal-code"
            inputMode="numeric"
            pattern="[0-9]{5}"
            maxLength={5}
            required
          />
        </label>
      </div>
      <Feedback error={error} done={done} text="Address updated." />
      <div className="order-actions">
        <button className="button" disabled={busy}>
          {busy ? "Saving…" : "Save address"}
        </button>
        {address.address_line1 && (
          <button
            type="button"
            className="button button-outline"
            disabled={busy}
            onClick={async () => {
              if (
                await confirm({
                  title: "Remove your saved address?",
                  message: "Checkout will no longer fill it in for you.",
                  confirmLabel: "Remove address",
                  tone: "danger",
                })
              )
                save({ address_line1: "", address_line2: "", city: "", postal_code: "" });
            }}
          >
            Remove address
          </button>
        )}
      </div>
    </form>
  );
}

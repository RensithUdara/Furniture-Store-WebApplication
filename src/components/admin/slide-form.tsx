"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/client-api";
import { ImageUpload } from "@/components/admin/upload";
import type { PromoSlide } from "@/types";
export function SlideForm({ slide: s }: { slide?: PromoSlide }) {
  const router = useRouter(),
    formRef = useRef<HTMLFormElement>(null);
  const [image, setImage] = useState(s?.image_url || ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await action();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save the slide.");
    } finally {
      setBusy(false);
    }
  }
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    run(async () => {
      await api("/api/slides", "POST", {
        id: s?.id,
        title: form.get("title"),
        subtitle: form.get("subtitle"),
        link_url: form.get("link_url"),
        button_label: form.get("button_label"),
        sort_order: Number(form.get("sort_order")),
        image_url: image,
        is_active: form.has("is_active"),
      });
      setSaved(true);
      if (!s) {
        formRef.current?.reset();
        setImage("");
      }
    });
  }
  return (
    <form ref={formRef} onSubmit={submit} className="form-card">
      <h2>{s ? s.title || "Untitled slide" : "Add a slide"}</h2>
      <div className="stack">
        {image && <img className="slide-preview" src={image} alt="Slide preview" />}
        <label className="field">
          Image URL
          <input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="Upload below or paste an https:// URL"
            required
          />
          <small>Wide images work best, around 1920 × 800.</small>
        </label>
        <ImageUpload bucket="promo-images" onUpload={setImage} />
        <label className="field">
          Headline
          <input name="title" defaultValue={s?.title} maxLength={120} />
        </label>
        <label className="field">
          Supporting text
          <input name="subtitle" defaultValue={s?.subtitle} maxLength={240} />
        </label>
        <div className="form-grid">
          <label className="field">
            Button label
            <input
              name="button_label"
              defaultValue={s?.button_label ?? "Shop now"}
              maxLength={40}
            />
          </label>
          <label className="field">
            Button link
            <input
              name="link_url"
              defaultValue={s?.link_url ?? "/products"}
              pattern="/.*"
              maxLength={300}
              required
            />
          </label>
          <label className="field">
            Position
            <input
              name="sort_order"
              type="number"
              min="0"
              max="9999"
              defaultValue={s?.sort_order ?? 0}
              required
            />
            <small>Lower numbers show first.</small>
          </label>
          <label className="check-label">
            <input name="is_active" type="checkbox" defaultChecked={s?.is_active ?? true} />
            Show on the home page
          </label>
        </div>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="success-message">
            Slide saved.
          </p>
        )}
        <div className="order-actions">
          <button className="button" disabled={busy}>
            {busy ? "Saving…" : s ? "Save slide" : "Add slide"}
          </button>
          {s && (
            <button
              type="button"
              className="button button-outline"
              disabled={busy}
              onClick={() => run(() => api("/api/slides", "DELETE", { id: s.id }))}
            >
              <Trash2 size={15} /> Delete
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

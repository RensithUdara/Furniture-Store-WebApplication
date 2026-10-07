"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import { ImageUpload } from "@/components/admin/upload";
import type { Category } from "@/types";
export function CategoryForm({
  category: c,
  parents = [],
}: {
  category?: Category;
  parents?: Category[];
}) {
  const router = useRouter(),
    formRef = useRef<HTMLFormElement>(null);
  const [image, setImage] = useState(c?.image_url || ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const form = new FormData(e.currentTarget);
      const { parent_id, ...values } = Object.fromEntries(form);
      await api("/api/categories", "POST", {
        ...values,
        // Only sent when a parent is chosen or cleared, so it also works before migration 004.
        ...(parent_id || c?.parent_id ? { parent_id: parent_id || null } : {}),
        id: c?.id,
        image_url: image,
        is_active: form.has("is_active"),
      });
      setSaved(true);
      if (!c) {
        formRef.current?.reset();
        setImage("");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save category.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form ref={formRef} onSubmit={submit} className="form-card">
      <h2>{c ? c.name : "Add a category"}</h2>
      <div className="stack">
        <label className="field">
          Name
          <input name="name" defaultValue={c?.name} required maxLength={100} />
        </label>
        <label className="field">
          URL slug
          <input
            name="slug"
            defaultValue={c?.slug}
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            maxLength={100}
          />
        </label>
        {parents.length > 0 && (
          <label className="field">
            Parent category
            <select name="parent_id" defaultValue={c?.parent_id || ""}>
              <option value="">None (top-level category)</option>
              {parents
                .filter((p) => p.id !== c?.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
            <small>Sub-categories appear in the menu dropdown under their parent.</small>
          </label>
        )}
        <label className="field">
          Description
          <textarea name="description" defaultValue={c?.description} maxLength={1000} />
        </label>
        <label className="field">
          Image URL
          <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://…" />
        </label>
        {image && <img src={image} alt="Category preview" style={{ height: 130 }} />}
        <ImageUpload bucket="category-images" onUpload={setImage} />
        <label className="check-label">
          <input name="is_active" type="checkbox" defaultChecked={c?.is_active ?? true} />
          Active category
        </label>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="success-message">
            Category saved.
          </p>
        )}
        <button className="button" disabled={busy}>
          {busy ? "Saving…" : c ? "Save category" : "Create category"}
        </button>
      </div>
    </form>
  );
}

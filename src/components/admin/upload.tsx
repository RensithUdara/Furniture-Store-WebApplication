"use client";
import { useState } from "react";
import { Upload } from "lucide-react";
import { api } from "@/lib/client-api";
export function ImageUpload({
  bucket,
  onUpload,
}: {
  bucket: "product-images" | "category-images" | "promo-images";
  onUpload: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <>
      <label className="upload-label">
        <Upload size={16} />
        {busy ? "Uploading…" : "Upload JPG, PNG, or WebP · max 5 MB"}
        <input
          aria-label="Upload image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setError("");
            setBusy(true);
            try {
              const data = new FormData();
              data.set("file", file);
              data.set("bucket", bucket);
              const result = await api<{ url: string }>("/api/uploads", "POST", data);
              onUpload(result.url);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Upload failed.");
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

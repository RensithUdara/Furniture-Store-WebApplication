"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { api } from "@/lib/client-api";
import { navigate } from "@/components/navigation-progress";
import { productSchema } from "@/lib/validation";
import { ROOMS, SIZES } from "@/lib/catalog-filter";
import { ImageUpload } from "@/components/admin/upload";
import type { Product, Category } from "@/types";
type EditableVariant = {
  id: string;
  sku: string;
  color: string;
  color_hex: string;
  material: string;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  is_active: boolean;
};
function newVariant(): EditableVariant {
  return {
    id: crypto.randomUUID(),
    sku: "",
    color: "Natural",
    color_hex: "#b9aa94",
    material: "",
    price: 0,
    compare_at_price: null,
    stock_quantity: 0,
    is_active: true,
  };
}
export function ProductForm({
  product: p,
  categories,
  extras = false,
}: {
  product?: Product;
  categories: Category[];
  // Rooms, size and video are saved once migration 012 has been run.
  extras?: boolean;
}) {
  const router = useRouter();
  const [variants, setVariants] = useState<EditableVariant[]>(
    p?.product_variants.map((v) => ({
      ...v,
      price: Number(v.price),
      compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : null,
    })) || [],
  );
  const [images, setImages] = useState(p?.product_images.map((i) => i.image_url) || []);
  const [rooms, setRooms] = useState<string[]>(p?.rooms || []);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const existing = new Set(p?.product_variants.map((v) => v.id) || []);
  function changeVariant(
    id: string,
    field: keyof EditableVariant,
    value: string | number | boolean | null,
  ) {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const form = new FormData(e.currentTarget);
      const values = Object.fromEntries(form);
      const activeVariants = variants.filter((v) => v.is_active);
      const pricedVariants = activeVariants.length ? activeVariants : variants;
      const data = productSchema.parse({
        ...values,
        id: p?.id,
        price: pricedVariants.length ? Math.min(...pricedVariants.map((v) => v.price)) : 0,
        is_active: form.has("is_active"),
        is_featured: form.has("is_featured"),
        images,
        variants,
        ...(extras ? { rooms } : {}),
      });
      await api("/api/products", "POST", data);
      navigate(router.push, "/admin/products");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save product.");
    } finally {
      setBusy(false);
    }
  }
  if (!categories.length)
    return (
      <div className="empty-state">
        <h2>A category comes first.</h2>
        <p>Create a category, then add your first product.</p>
        <Link className="button" href="/admin/categories">
          Manage categories
        </Link>
      </div>
    );
  return (
    <form onSubmit={submit}>
      <section className="form-card">
        <h2>Product details</h2>
        <div className="form-grid">
          <label className="field">
            Product name
            <input name="name" defaultValue={p?.name} maxLength={150} required />
          </label>
          <label className="field">
            URL slug
            <input
              name="slug"
              defaultValue={p?.slug}
              placeholder="oak-dining-table"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              required
            />
          </label>
          <label className="field">
            Category
            <select name="category_id" defaultValue={p?.category_id || categories[0]?.id}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {!c.is_active ? " (inactive)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Brand
            <input name="brand" defaultValue={p?.brand || "Forma & Co."} maxLength={100} required />
          </label>
          <label className="field full">
            Description
            <textarea name="description" defaultValue={p?.description} required maxLength={5000} />
          </label>
          <label className="field">
            Material
            <input name="material" defaultValue={p?.material} required maxLength={100} />
          </label>
          <label className="field">
            Dimensions
            <input
              name="dimensions"
              defaultValue={p?.dimensions}
              placeholder="180 × 90 × 75 cm"
              required
              maxLength={200}
            />
          </label>
          {extras && (
            <>
              <label className="field">
                Size
                <select name="size" defaultValue={p?.size || ""}>
                  <option value="">Not set</option>
                  {SIZES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <small>Lets shoppers filter the collection by size.</small>
              </label>
              <label className="field">
                Video link (optional)
                <input
                  name="video_url"
                  type="url"
                  defaultValue={p?.video_url}
                  placeholder="https://www.youtube.com/watch?v=…"
                  maxLength={500}
                />
                <small>A YouTube link, or a direct https link to an .mp4 or .webm file.</small>
              </label>
              <fieldset className="field full room-picker">
                <legend>Rooms this piece suits</legend>
                <div>
                  {ROOMS.map((r) => (
                    <label className="check-label" key={r}>
                      <input
                        type="checkbox"
                        checked={rooms.includes(r)}
                        onChange={() =>
                          setRooms(rooms.includes(r) ? rooms.filter((v) => v !== r) : [...rooms, r])
                        }
                      />
                      {r}
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          )}
          <label className="check-label">
            <input type="checkbox" name="is_active" defaultChecked={p?.is_active ?? true} />
            Visible in store
          </label>
          <label className="check-label">
            <input type="checkbox" name="is_featured" defaultChecked={p?.is_featured ?? false} />
            Featured on homepage
          </label>
        </div>
      </section>
      <section className="form-card">
        <h2>Image gallery</h2>
        <p>The first image is the cover. Add up to eight images.</p>
        {images.map((url, index) => (
          <div className="image-editor" key={index}>
            <img src={url || "/images/living.jpg"} alt={`Product image ${index + 1}`} />
            <input
              aria-label={`Image ${index + 1} URL`}
              value={url}
              onChange={(e) =>
                setImages((v) => v.map((u, i) => (i === index ? e.target.value : u)))
              }
              required
            />
            <button
              type="button"
              aria-label={`Remove image ${index + 1}`}
              onClick={() => setImages((v) => v.filter((_, i) => i !== index))}
            >
              <X size={17} />
            </button>
          </div>
        ))}
        {images.length < 8 && (
          <>
            <button
              type="button"
              className="text-link"
              onClick={() => setImages((v) => [...v, ""])}
            >
              Add image URL <Plus size={14} />
            </button>
            <div>
              <ImageUpload
                bucket="product-images"
                onUpload={(url) => setImages((v) => [...v, url].slice(0, 8))}
              />
            </div>
          </>
        )}
      </section>
      <section className="form-card">
        <h2>Finishes & variants</h2>
        <p>
          Each finish has its own SKU and price. Existing stock is managed in{" "}
          <Link className="text-link" href="/admin/inventory">
            Inventory
          </Link>
          .
        </p>
        {variants.map((v, index) => (
          <div className="variant-editor" key={v.id}>
            <div className="variant-editor-title">
              <h3>Variant {index + 1}</h3>
              <button
                type="button"
                aria-label={`Remove variant ${index + 1}`}
                onClick={() => setVariants((prev) => prev.filter((i) => i.id !== v.id))}
              >
                <X size={16} />
              </button>
            </div>
            <div className="form-grid">
              <label className="field">
                SKU
                <input
                  value={v.sku}
                  onChange={(e) => changeVariant(v.id, "sku", e.target.value)}
                  required
                  maxLength={80}
                />
              </label>
              <label className="field">
                Finish / color
                <input
                  value={v.color}
                  onChange={(e) => changeVariant(v.id, "color", e.target.value)}
                  required
                  maxLength={60}
                />
              </label>
              <label className="field">
                Swatch color
                <input
                  type="color"
                  value={v.color_hex}
                  onChange={(e) => changeVariant(v.id, "color_hex", e.target.value)}
                />
              </label>
              <label className="field">
                Material
                <input
                  value={v.material}
                  onChange={(e) => changeVariant(v.id, "material", e.target.value)}
                  required
                  maxLength={100}
                />
              </label>
              <label className="field">
                Price (Rs.)
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max="100000000"
                  value={v.price || ""}
                  onChange={(e) => changeVariant(v.id, "price", Number(e.target.value))}
                  required
                />
              </label>
              <label className="field">
                Was price (Rs., optional)
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max="100000000"
                  value={v.compare_at_price || ""}
                  onChange={(e) =>
                    changeVariant(
                      v.id,
                      "compare_at_price",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                />
                <small>Higher than the price, to show this finish as on sale.</small>
              </label>
              <label className="field">
                {existing.has(v.id) ? "Available stock (read only)" : "Initial stock"}
                <input
                  type="number"
                  min="0"
                  max="100000"
                  disabled={existing.has(v.id)}
                  value={v.stock_quantity}
                  onChange={(e) => changeVariant(v.id, "stock_quantity", Number(e.target.value))}
                />
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={v.is_active}
                  onChange={(e) => changeVariant(v.id, "is_active", e.target.checked)}
                />
                Active finish
              </label>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="button button-outline button-small"
          disabled={variants.length >= 30}
          onClick={() => setVariants((v) => [...v, newVariant()])}
        >
          <Plus size={15} /> Add finish
        </button>
      </section>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <div className="order-actions">
        <button className="button" disabled={busy}>
          {busy ? "Saving…" : "Save product"}
        </button>
        <Link href="/admin/products" className="button button-outline">
          Back to products
        </Link>
      </div>
    </form>
  );
}

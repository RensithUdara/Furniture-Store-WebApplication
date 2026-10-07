"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Search, Star } from "lucide-react";
import { api } from "@/lib/client-api";
import { money, stockLabel, stockTone } from "@/lib/format";
import { totalStock } from "@/lib/catalog-filter";
import type { Product } from "@/types";
export function ProductTable({ products }: { products: Product[] }) {
  const router = useRouter();
  const [query, setQuery] = useState(""),
    [show, setShow] = useState("all"),
    [busy, setBusy] = useState(""),
    [error, setError] = useState("");
  const rows = products.filter(
    (p) =>
      `${p.name} ${p.categories?.name} ${p.product_variants.map((v) => v.sku).join(" ")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()) &&
      (show === "all" || (show === "active") === p.is_active),
  );
  async function toggle(p: Product) {
    setBusy(p.id);
    setError("");
    try {
      await api(`/api/products/${p.id}`, "PATCH", { is_active: !p.is_active });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update the product.");
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <div className="catalog-tools">
        <div className="search-field">
          <Search size={18} />
          <input
            aria-label="Search products"
            placeholder="Search name, category, or SKU…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <label className="sort-label">
          Show
          <select
            aria-label="Filter by visibility"
            value={show}
            onChange={(e) => setShow(e.target.value)}
          >
            <option value="all">All products</option>
            <option value="active">Visible in store</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>From</th>
              <th>Variants</th>
              <th>Stock</th>
              <th>Visibility</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const stock = totalStock(p);
              return (
                <tr key={p.id} className={p.is_active ? "" : "is-muted"}>
                  <td>
                    <div className="table-product">
                      <img src={p.product_images[0]?.image_url || "/images/living.jpg"} alt="" />
                      <span>
                        <strong>
                          {p.name}
                          {p.is_featured && <Star size={12} aria-label="Featured" />}
                        </strong>
                        <small>{p.material}</small>
                      </span>
                    </div>
                  </td>
                  <td>{p.categories?.name}</td>
                  <td>{money(p.price)}</td>
                  <td>{p.product_variants.filter((v) => v.is_active).length}</td>
                  <td>
                    <span className={`status stock-${stockTone(stock)}`}>
                      {stock > 10 ? `${stock} in stock` : stockLabel(stock)}
                    </span>
                  </td>
                  <td>
                    <span className={`status ${p.is_active ? "status-paid" : ""}`}>
                      {p.is_active ? "Visible" : "Hidden"}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <Link href={`/admin/products/${p.id}/edit`} aria-label={`Edit ${p.name}`}>
                        <Pencil size={15} /> Edit
                      </Link>
                      <button
                        disabled={busy === p.id}
                        onClick={() => toggle(p)}
                        aria-label={`${p.is_active ? "Hide" : "Show"} ${p.name}`}
                      >
                        {p.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                        {p.is_active ? "Hide" : "Show"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!rows.length && <p className="info-message">No products match your filters.</p>}
    </>
  );
}

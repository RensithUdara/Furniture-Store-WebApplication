"use client";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/types";
const KEY = "forma-recent";
const read = (): string[] => {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(value) ? value.filter((v) => typeof v === "string").slice(0, 12) : [];
  } catch {
    return [];
  }
};
// Products this browser looked at before, newest first. Nothing is sent to the server:
// the list lives in the visitor's own browser. `current` is recorded and left out of the row.
export function RecentlyViewed({ current, products }: { current?: string; products: Product[] }) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    const seen = read();
    setIds(seen.filter((id) => id !== current));
    if (!current) return;
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify([current, ...seen.filter((id) => id !== current)].slice(0, 9)),
      );
    } catch {}
  }, [current]);
  const list = ids.flatMap((id) => products.find((p) => p.id === id) || []).slice(0, 4);
  if (!list.length) return null;
  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Pick up where you left off</span>
          <h2>Recently viewed</h2>
        </div>
      </div>
      <div className="product-grid">
        {list.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { money } from "@/lib/format";
import { Photo } from "@/components/photo";
import type { Bundle, Product } from "@/types";
// A room set: its pieces, what they cost apart, and what they cost together. The button adds
// one of each piece to the bag; the saving then shows in the bag and at checkout, and the
// database applies it when the order is saved.
export function BundleCard({ bundle: b, products }: { bundle: Bundle; products: Product[] }) {
  const { add, items } = useCart();
  const [added, setAdded] = useState(false);
  // For each piece, the lowest-priced finish that is in stock.
  const picks = products.map((p) => ({
    product: p,
    variant: p.product_variants
      .filter((v) => v.is_active && v.stock_quantity > 0)
      .sort((x, y) => Number(x.price) - Number(y.price))[0],
  }));
  const available = picks.every((x) => x.variant);
  const apart = picks.reduce((sum, x) => sum + Number(x.variant?.price ?? x.product.price), 0);
  const saving = Math.round(apart * b.discount_percent) / 100;
  // Pieces not yet in the bag each need a free line; a bag holds 30 different items.
  const fresh = picks.filter((x) => !items.some((i) => i.variant_id === x.variant?.id)).length;
  const room = items.length + fresh <= 30;
  function addSet() {
    for (const { product: p, variant: v } of picks)
      if (v)
        add({
          variant_id: v.id,
          product_id: p.id,
          slug: p.slug,
          name: p.name,
          details: `${v.color} / ${v.material}`,
          image: p.product_images[0]?.image_url || "/images/living.jpg",
          price: Number(v.price),
          quantity: 1,
          stock: v.stock_quantity,
        });
    setAdded(true);
  }
  return (
    <article className="bundle-card" id={`set-${b.id}`}>
      <header>
        <div>
          <span className="eyebrow">Room set</span>
          <h3>{b.name}</h3>
          {b.description && <p>{b.description}</p>}
        </div>
        <span className="sale-badge">Save {b.discount_percent}%</span>
      </header>
      <ul className="bundle-items">
        {picks.map(({ product: p, variant: v }, i) => (
          <li key={p.id}>
            {i > 0 && <Plus className="bundle-plus" size={18} aria-hidden />}
            <Link href={`/products/${p.slug}`}>
              <Photo
                src={p.product_images[0]?.image_url || "/images/living.jpg"}
                alt=""
                width={300}
                height={300}
                sizes="150px"
              />
              <strong>{p.name}</strong>
              <small>{v ? money(Number(v.price)) : "Out of stock"}</small>
            </Link>
          </li>
        ))}
      </ul>
      <footer>
        <p className="bundle-price">
          <s>{money(apart)}</s>
          <strong>{money(apart - saving)}</strong>
          <small>You save {money(saving)} when you order them together.</small>
        </p>
        <button className="button" disabled={!available || !room} onClick={addSet}>
          <ShoppingBag size={18} />
          {!available
            ? "A piece is out of stock"
            : !room
              ? "Your bag is full"
              : "Add the set to bag"}
        </button>
      </footer>
      {added && (
        <div className="success-message" role="status">
          <Check size={16} /> The set is in your bag, with the saving applied.{" "}
          <Link href="/cart">
            View bag <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </article>
  );
}

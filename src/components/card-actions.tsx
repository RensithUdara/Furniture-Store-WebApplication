"use client";
import { useEffect, useState } from "react";
import { Check, MessageCircle, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useStore, whatsappLink } from "@/components/store-provider";
import { money } from "@/lib/format";
import type { Product } from "@/types";
// Quick actions on a product card. They use the first finish that is in stock;
// other finishes are chosen on the product page.
export function CardActions({ product: p }: { product: Product }) {
  const { add, items } = useCart();
  const { whatsapp } = useStore();
  const [added, setAdded] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const v = p.product_variants.find((v) => v.is_active && v.stock_quantity > 0);
  if (!v)
    return (
      <div className="card-actions">
        <button className="card-button cart" disabled>
          Out of stock
        </button>
      </div>
    );
  const inBag = items.find((i) => i.variant_id === v.id)?.quantity || 0;
  const full = inBag >= Math.min(v.stock_quantity, 20) || (items.length >= 30 && !inBag);
  return (
    <div className="card-actions">
      {whatsapp && (
        <a
          className="card-button whatsapp"
          href={whatsappLink(
            whatsapp,
            `Hello Forma & Co., I'd like to order:\n${p.name} (${v.color} / ${v.material}) × 1, ${money(v.price)}\n${origin}/products/${p.slug}`,
          )}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={16} />
          <span>
            <span className="long">Buy via </span>WhatsApp
          </span>
        </a>
      )}
      <button
        className="card-button cart"
        disabled={full}
        onClick={() => {
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
          setTimeout(() => setAdded(false), 1800);
        }}
      >
        {added ? <Check size={16} /> : <ShoppingCart size={16} />}
        {added ? "Added" : full ? "Maximum in cart" : "Add to cart"}
      </button>
    </div>
  );
}

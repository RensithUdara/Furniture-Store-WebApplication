"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Minus,
  Plus,
  ShoppingBag,
  Truck,
  ArrowRight,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { WishButton } from "@/components/wishlist-provider";
import { NotifyMe, Stars } from "@/components/shop-extras";
import { money, stockLabel, stockTone } from "@/lib/format";
import type { Product, StoreSettings } from "@/types";
export function ProductDetail({
  product: p,
  settings,
  signedIn = false,
}: {
  product: Product;
  settings: StoreSettings | null;
  signedIn?: boolean;
}) {
  const variants = p.product_variants.filter((v) => v.is_active);
  const [variantId, setVariantId] = useState(variants[0]?.id),
    [quantity, setQuantity] = useState(1),
    [photo, setPhoto] = useState(0),
    [added, setAdded] = useState(false);
  const { add, items } = useCart();
  const v = variants.find((v) => v.id === variantId);
  const already = items.find((i) => i.variant_id === v?.id)?.quantity || 0;
  const available = v ? Math.max(0, Math.min(20, v.stock_quantity) - already) : 0;
  const was =
    v?.compare_at_price && Number(v.compare_at_price) > Number(v.price)
      ? Number(v.compare_at_price)
      : 0;
  function addItem() {
    if (!v || !available) return;
    add({
      variant_id: v.id,
      product_id: p.id,
      slug: p.slug,
      name: p.name,
      details: `${v.color} / ${v.material}`,
      image: p.product_images[0]?.image_url || "/images/living.jpg",
      price: Number(v.price),
      quantity: Math.min(quantity, available),
      stock: v.stock_quantity,
    });
    setAdded(true);
  }
  return (
    <div className="product-detail">
      <div className="gallery">
        <div className="main-photo">
          <img
            src={p.product_images[photo]?.image_url || "/images/living.jpg"}
            alt={`${p.name}, image ${photo + 1}`}
          />
        </div>
        {p.product_images.length > 1 && (
          <div className="thumbnails">
            {p.product_images.map((img, i) => (
              <button
                key={img.id}
                className={photo === i ? "selected" : ""}
                onClick={() => setPhoto(i)}
                aria-label={`View image ${i + 1}`}
                aria-pressed={photo === i}
              >
                <img src={img.image_url} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="detail-copy">
        <span className="eyebrow">
          {p.categories.name} / {p.brand}
        </span>
        <h1>{p.name}</h1>
        {p.rating && (
          <a className="detail-rating" href="#reviews">
            <Stars value={p.rating.avg} size={17} /> {p.rating.avg.toFixed(1)} · {p.rating.count}{" "}
            {p.rating.count === 1 ? "review" : "reviews"}
          </a>
        )}
        <p className="detail-price">
          {money(v?.price || p.price)}
          {was > 0 && (
            <>
              <s>{money(was)}</s>
              <span className="sale-badge">
                Save {Math.round((1 - Number(v!.price) / was) * 100)}%
              </span>
            </>
          )}
        </p>
        <WishButton productId={p.id} name={p.name} label />
        <p className="detail-description">{p.description}</p>
        <fieldset className="variant-fieldset">
          <legend>
            Finish{" "}
            <span>
              {v?.color} / {v?.material}
            </span>
          </legend>
          <div className="variant-options">
            {variants.map((variant) => (
              <button
                key={variant.id}
                className={v?.id === variant.id ? "variant selected" : "variant"}
                aria-pressed={v?.id === variant.id}
                onClick={() => {
                  setVariantId(variant.id);
                  setQuantity(1);
                  setAdded(false);
                }}
              >
                <span style={{ background: variant.color_hex }} />
                {variant.color}
                <small>{variant.material}</small>
              </button>
            ))}
          </div>
        </fieldset>
        <p className={`stock-status ${stockTone(v?.stock_quantity || 0)}`}>
          <span />
          {stockLabel(v?.stock_quantity || 0)}
          {already > 0 && <small>· {already} already in your bag</small>}
        </p>
        {v && v.stock_quantity === 0 && (
          <NotifyMe key={v.id} variantId={v.id} signedIn={signedIn} />
        )}
        <div className="add-row">
          <div className="quantity-control">
            <button
              aria-label="Decrease quantity"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => q - 1)}
            >
              <Minus size={15} />
            </button>
            <span aria-live="polite">{quantity}</span>
            <button
              aria-label="Increase quantity"
              disabled={quantity >= available}
              onClick={() => setQuantity((q) => q + 1)}
            >
              <Plus size={15} />
            </button>
          </div>
          <button
            className="button"
            disabled={!available || (items.length >= 30 && !already)}
            onClick={addItem}
          >
            <ShoppingBag size={18} />
            {!available ? (already ? "Maximum in bag" : "Out of stock") : "Add to bag"}
          </button>
        </div>
        {added && (
          <div className="success-message" role="status">
            A lovely choice. Added to your bag.{" "}
            <Link href="/cart">
              View bag <ArrowRight size={15} />
            </Link>
          </div>
        )}
        <ul className="assurances">
          <li>
            <Truck size={19} />
            <span>
              {!settings
                ? "Islandwide delivery"
                : (v?.price || p.price) >= settings.free_delivery_from
                  ? "Complimentary islandwide delivery"
                  : `Islandwide delivery · ${money(settings.delivery_fee)}`}
              <small>
                {settings
                  ? `Free delivery on orders of ${money(settings.free_delivery_from)} or more.`
                  : "The delivery fee is confirmed at checkout."}
              </small>
            </span>
          </li>
          <li>
            <ShieldCheck size={19} />
            <span>
              Secure PayHere checkout
              <small>Your order is confirmed after a verified payment.</small>
            </span>
          </li>
          <li>
            <MessageCircle size={19} />
            <span>
              Or order on WhatsApp
              <small>Send your bag to our team and arrange payment directly.</small>
            </span>
          </li>
        </ul>
        <details open>
          <summary>Details & dimensions</summary>
          <dl className="spec-list">
            <div>
              <dt>Material</dt>
              <dd>{v?.material || p.material}</dd>
            </div>
            <div>
              <dt>Dimensions</dt>
              <dd>{p.dimensions}</dd>
            </div>
            <div>
              <dt>SKU</dt>
              <dd>{v?.sku || "Unavailable"}</dd>
            </div>
          </dl>
        </details>
        <details>
          <summary>Care & delivery</summary>
          <p>
            Dust with a soft, dry cloth. Keep away from prolonged direct sunlight and moisture. Your
            delivery arrangement is confirmed after ordering.{" "}
            <Link href="/help">Read our care guide.</Link>
          </p>
        </details>
      </div>
    </div>
  );
}

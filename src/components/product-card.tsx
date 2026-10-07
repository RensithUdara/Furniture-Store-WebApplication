import Link from "next/link";
import { money } from "@/lib/format";
import { totalStock } from "@/lib/catalog-filter";
import { CardActions } from "@/components/card-actions";
import { WishButton } from "@/components/wishlist-provider";
import type { Product } from "@/types";
export function ProductCard({ product: p }: { product: Product }) {
  const variants = p.product_variants.filter((v) => v.is_active);
  const stock = totalStock(p);
  const prices = variants.map((v) => Number(v.price));
  const price = prices.length ? Math.min(...prices) : p.price;
  return (
    <article className={`product-card${stock === 0 ? " is-out" : ""}`}>
      <Link href={`/products/${p.slug}`} className="product-image">
        <img
          src={p.product_images[0]?.image_url || "/images/living.jpg"}
          alt={p.name}
          loading="lazy"
        />
        {p.is_featured && stock > 0 && <span className="product-tag">Bestseller</span>}
      </Link>
      <WishButton productId={p.id} name={p.name} />
      <div className="product-body">
        <div className="product-meta">
          <span>{p.categories?.name}</span>
          <div className="swatches" aria-label={`${variants.length} finishes`}>
            {variants.slice(0, 4).map((v) => (
              <span key={v.id} title={v.color} style={{ background: v.color_hex }} />
            ))}
          </div>
        </div>
        <Link href={`/products/${p.slug}`}>
          <h3>{p.name}</h3>
        </Link>
        <p className="product-price">
          {new Set(prices).size > 1 && <small>From </small>}
          {money(price)}
        </p>
        <p className={`product-stock ${stock === 0 ? "out" : stock <= 10 ? "low" : ""}`}>
          {stock === 0 ? "Out of stock" : stock <= 10 ? `Only ${stock} left` : "In stock"}
        </p>
        <CardActions product={p} />
      </div>
    </article>
  );
}

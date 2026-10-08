import Link from "next/link";
import { money } from "@/lib/format";
import { totalStock } from "@/lib/catalog-filter";
import { CardActions } from "@/components/card-actions";
import { WishButton } from "@/components/wishlist-provider";
import { CompareToggle, Stars } from "@/components/shop-extras";
import { Countdown } from "@/components/marketing";
import { Photo } from "@/components/photo";
import type { Product } from "@/types";
export function ProductCard({
  product: p,
  eager = false,
}: {
  product: Product;
  // True for the first cards on a page, whose photos should load straight away.
  eager?: boolean;
}) {
  const variants = p.product_variants.filter((v) => v.is_active);
  const stock = totalStock(p);
  const prices = variants.map((v) => Number(v.price));
  const price = prices.length ? Math.min(...prices) : p.price;
  // On sale when the cheapest finish has a higher "was" price.
  const cheapest = variants.find((v) => Number(v.price) === price);
  const was = cheapest?.compare_at_price ? Number(cheapest.compare_at_price) : 0;
  const off = was > price ? Math.round((1 - price / was) * 100) : 0;
  return (
    <article className={`product-card${stock === 0 ? " is-out" : ""}`}>
      <Link href={`/products/${p.slug}`} className="product-image">
        <Photo
          src={p.product_images[0]?.image_url || "/images/living.jpg"}
          alt={p.name}
          width={600}
          height={660}
          sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 320px"
          eager={eager}
        />
        {off > 0 ? (
          <span className="product-tag sale">{off}% off</span>
        ) : (
          p.is_featured && stock > 0 && <span className="product-tag">Bestseller</span>
        )}
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
        {p.rating && <Stars value={p.rating.avg} count={p.rating.count} />}
        <p className="product-price">
          {new Set(prices).size > 1 && <small>From </small>}
          {off > 0 && <s>{money(was)}</s>}
          {money(price)}
        </p>
        <p className={`product-stock ${stock === 0 ? "out" : stock <= 10 ? "low" : ""}`}>
          {stock === 0 ? "Out of stock" : stock <= 10 ? `Only ${stock} left` : "In stock"}
        </p>
        {p.flash && stock > 0 && <Countdown ends={p.flash.ends_at} compact />}
        <CardActions product={p} />
        <CompareToggle productId={p.id} name={p.name} />
      </div>
    </article>
  );
}

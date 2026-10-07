import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { accountUser } from "@/lib/account";
import { getProducts } from "@/services/catalog";
import { getWishlistIds } from "@/services/rewards";
import { ProductCard } from "@/components/product-card";
export const dynamic = "force-dynamic";
export const metadata = { title: "My wishlist" };
export default async function AccountWishlist() {
  await accountUser("/account/wishlist");
  const [ids, products] = await Promise.all([getWishlistIds(), getProducts()]);
  // Saved order, newest first. Products that were hidden since simply drop out.
  const saved = (ids || []).flatMap((id) => products.find((p) => p.id === id) || []);
  return (
    <>
      <div className="account-heading">
        <span className="eyebrow">My account</span>
        <h1>My wishlist</h1>
        <p>Pieces you have saved for later. Prices and stock are always current.</p>
      </div>
      {ids === null ? (
        <div className="info-message">The wishlist is not available at the moment.</div>
      ) : saved.length ? (
        <div className="product-grid wishlist-grid">
          {saved.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="empty-state panel">
          <Heart size={38} />
          <h2>Nothing saved yet</h2>
          <p>Tap the heart on any product to keep it here for later.</p>
          <Link className="button" href="/products">
            Browse furniture <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </>
  );
}

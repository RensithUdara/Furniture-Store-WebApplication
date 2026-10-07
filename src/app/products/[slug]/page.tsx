import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getProduct, getProducts } from "@/services/catalog";
import { getSettings } from "@/services/settings";
import { canReview, getAlsoBoughtIds, getReviews } from "@/services/shopping";
import { ProductDetail } from "@/components/product-detail";
import { ProductCard } from "@/components/product-card";
import { Reviews } from "@/components/shop-extras";
import { RecentlyViewed } from "@/components/recently-viewed";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProduct((await params).slug);
  return { title: p?.name || "Product not found", description: p?.description };
}
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const [products, user, reviews, alsoIds, settings] = await Promise.all([
    getProducts(),
    currentUser(),
    getReviews(p.id),
    getAlsoBoughtIds(p.id),
    getSettings(),
  ]);
  // What other customers ordered together with this piece, topped up from the same category.
  const also = alsoIds.flatMap((id) => products.find((v) => v.id === id) || []);
  const related = [
    ...also,
    ...products
      .filter((v) => v.id !== p.id && !also.includes(v))
      .sort(
        (a, b) => Number(b.category_id === p.category_id) - Number(a.category_id === p.category_id),
      ),
  ].slice(0, 4);
  return (
    <div className="container page-space">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/products">Collection</Link>
        <span>/</span>
        <span>{p.name}</span>
      </nav>
      <ProductDetail product={p} settings={settings} signedIn={Boolean(user)} />
      {/* Reviews arrive with migration 011; null means the table is not there yet. */}
      {reviews && (
        <Reviews
          productId={p.id}
          reviews={reviews}
          eligible={user ? await canReview(p.id) : false}
          userId={user?.id || null}
          canModerate={can(user?.profile, "products")}
        />
      )}
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              {also.length ? "Often ordered together" : "Good company"}
            </span>
            <h2>{also.length ? "Customers also bought" : "You may also like"}</h2>
          </div>
        </div>
        <div className="product-grid">
          {related.map((v) => (
            <ProductCard key={v.id} product={v} />
          ))}
        </div>
      </section>
      <RecentlyViewed current={p.id} products={products} />
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getProduct, getProducts, getShopBundles } from "@/services/catalog";
import { BundleCard } from "@/components/bundle-card";
import { getSettings } from "@/services/settings";
import { canReview, getAlsoBoughtIds, getReviews } from "@/services/shopping";
import { ProductDetail } from "@/components/product-detail";
import { ProductCard } from "@/components/product-card";
import { Reviews } from "@/components/shop-extras";
import { RecentlyViewed } from "@/components/recently-viewed";
import { absolute, jsonLd, SITE_NAME } from "@/lib/seo";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProduct((await params).slug);
  if (!p) return { title: "Product not found", robots: { index: false } };
  // One or two sentences for search results and share cards.
  const description =
    p.description.length > 160 ? `${p.description.slice(0, 157).trimEnd()}…` : p.description;
  const images = p.product_images.slice(0, 4).map((i) => ({ url: i.image_url, alt: p.name }));
  return {
    title: p.name,
    description,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: {
      type: "website",
      title: `${p.name} | ${SITE_NAME}`,
      description,
      url: `/products/${p.slug}`,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: p.name,
      description,
      images: images.map((i) => i.url),
    },
  };
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
  const sets = (await getShopBundles(products)).filter((b) => b.product_ids.includes(p.id));
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
  // Structured data, so search engines can show price, stock and rating beside the result.
  const active = p.product_variants.filter((v) => v.is_active);
  const prices = active.map((v) => Number(v.price));
  const inStock = active.some((v) => v.stock_quantity > 0);
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      description: p.description,
      image: p.product_images.map((i) => absolute(i.image_url)),
      sku: active[0]?.sku,
      brand: { "@type": "Brand", name: p.brand },
      category: p.categories?.name,
      material: p.material,
      ...(p.rating
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: Number(p.rating.avg.toFixed(1)),
              reviewCount: p.rating.count,
            },
          }
        : {}),
      ...(prices.length
        ? {
            offers: {
              "@type": "AggregateOffer",
              url: absolute(`/products/${p.slug}`),
              priceCurrency: "LKR",
              lowPrice: Math.min(...prices),
              highPrice: Math.max(...prices),
              offerCount: prices.length,
              availability: `https://schema.org/${inStock ? "InStock" : "OutOfStock"}`,
              ...(p.flash ? { priceValidUntil: p.flash.ends_at.slice(0, 10) } : {}),
            },
          }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { name: "Home", item: absolute("/") },
        { name: "Collection", item: absolute("/products") },
        { name: p.name, item: absolute(`/products/${p.slug}`) },
      ].map((b, i) => ({ "@type": "ListItem", position: i + 1, ...b })),
    },
  ];
  return (
    <div className="container page-space">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/products">Collection</Link>
        <span>/</span>
        <span>{p.name}</span>
      </nav>
      <ProductDetail product={p} settings={settings} signedIn={Boolean(user)} />
      {sets.length > 0 && (
        <section className="section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Better together</span>
              <h2>Complete the room</h2>
            </div>
            <Link className="text-link" href="/bundles">
              All room sets
            </Link>
          </div>
          <div className="bundle-list">
            {sets.map((b) => (
              <BundleCard
                key={b.id}
                bundle={b}
                products={b.product_ids.flatMap((id) => products.find((v) => v.id === id) || [])}
              />
            ))}
          </div>
        </section>
      )}
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

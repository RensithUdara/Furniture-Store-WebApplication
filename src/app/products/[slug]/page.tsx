import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/services/catalog";
import { ProductDetail } from "@/components/product-detail";
import { ProductCard } from "@/components/product-card";
import { getSettings } from "@/services/settings";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProduct((await params).slug);
  return { title: p?.name || "Product not found", description: p?.description };
}
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const related = (await getProducts())
    .filter((v) => v.id !== p.id)
    .sort(
      (a, b) => Number(b.category_id === p.category_id) - Number(a.category_id === p.category_id),
    )
    .slice(0, 4);
  return (
    <div className="container page-space">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/products">Collection</Link>
        <span>/</span>
        <span>{p.name}</span>
      </nav>
      <ProductDetail product={p} settings={await getSettings()} />
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Good company</span>
            <h2>Make room for more.</h2>
          </div>
        </div>
        <div className="product-grid">
          {related.map((v) => (
            <ProductCard key={v.id} product={v} />
          ))}
        </div>
      </section>
    </div>
  );
}

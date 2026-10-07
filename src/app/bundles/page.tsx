import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import { ArrowRight, Sofa } from "lucide-react";
import { getProducts, getShopBundles } from "@/services/catalog";
import { BundleCard } from "@/components/bundle-card";
export const dynamic = "force-dynamic";
export const metadata = pageMeta({
  title: "Room sets",
  description:
    "Furniture sets chosen to go together, at a lower price when you order the whole set. Delivered across Sri Lanka by Forma & Co.",
  path: "/bundles",
});
export default async function Bundles() {
  const products = await getProducts();
  const bundles = await getShopBundles(products);
  return (
    <div className="container page-space">
      <div className="page-heading">
        <span className="eyebrow">Complete the room</span>
        <h1>Room sets.</h1>
        <p>Pieces chosen to go together, at a lower price when you order the whole set.</p>
      </div>
      {bundles.length ? (
        <div className="bundle-list">
          {bundles.map((b) => (
            <BundleCard
              key={b.id}
              bundle={b}
              products={b.product_ids.flatMap((id) => products.find((p) => p.id === id) || [])}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Sofa size={36} strokeWidth={1} />
          <h2>No room sets at the moment.</h2>
          <p>Every piece is still available on its own.</p>
          <Link className="button" href="/products">
            Explore the collection <ArrowRight size={17} />
          </Link>
        </div>
      )}
    </div>
  );
}

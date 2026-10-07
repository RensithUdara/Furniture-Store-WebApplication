import { PRIVATE } from "@/lib/seo";
import { getProducts } from "@/services/catalog";
import { CompareTable } from "@/components/shop-extras";
export const dynamic = "force-dynamic";
export const metadata = { title: "Compare products", robots: PRIVATE };
export default async function Compare() {
  return (
    <div className="container page-space">
      <div className="page-heading">
        <span className="eyebrow">Side by side</span>
        <h1>Compare products</h1>
        <p>Price, size, material and availability for the pieces you picked.</p>
      </div>
      <CompareTable products={await getProducts()} />
    </div>
  );
}

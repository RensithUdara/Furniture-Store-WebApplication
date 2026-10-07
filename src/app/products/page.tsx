import { getCategories, getProducts } from "@/services/catalog";
import { ProductBrowser } from "@/components/product-browser";
export const dynamic = "force-dynamic";
export const metadata = { title: "The collection" };
export default async function Products({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [products, categories, params] = await Promise.all([
    getProducts(),
    getCategories(),
    searchParams,
  ]);
  return (
    <div className="container page-space">
      <div className="page-heading">
        <span className="eyebrow">The collection</span>
        <h1>Find your everyday favourite.</h1>
        <p>Considered pieces for every corner of your home.</p>
      </div>
      <ProductBrowser
        key={JSON.stringify(params)}
        products={products}
        categories={categories}
        initialCategory={typeof params.category === "string" ? params.category : ""}
        initialQuery={typeof params.q === "string" ? params.q : ""}
        initialSort={typeof params.sort === "string" ? params.sort : "newest"}
        focusSearch={params.search === "1"}
      />
    </div>
  );
}

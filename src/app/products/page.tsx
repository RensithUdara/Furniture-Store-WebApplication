import { browse } from "@/services/catalog";
import { facets, parseFilter } from "@/lib/catalog-filter";
import { ProductBrowser } from "@/components/product-browser";
export const dynamic = "force-dynamic";
export const metadata = { title: "The collection" };
export default async function Products({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initial = parseFilter((key) =>
    typeof params[key] === "string" ? (params[key] as string) : undefined,
  );
  // Only the first page is sent to the browser; the rest arrives as the shopper asks for it.
  const { items, total, products, categories } = await browse(initial);
  return (
    <div className="container page-space">
      <div className="page-heading">
        <span className="eyebrow">The collection</span>
        <h1>Find your everyday favourite.</h1>
        <p>Considered pieces for every corner of your home.</p>
      </div>
      <ProductBrowser
        key={JSON.stringify(params)}
        first={{ items, total }}
        facets={facets(products, categories)}
        categories={categories}
        initial={initial}
        focusSearch={params.search === "1"}
      />
    </div>
  );
}

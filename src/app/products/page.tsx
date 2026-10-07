import { browse, getCategories } from "@/services/catalog";
import { absolute, jsonLd, pageMeta } from "@/lib/seo";
import { facets, parseFilter } from "@/lib/catalog-filter";
import { ProductBrowser } from "@/components/product-browser";
export const dynamic = "force-dynamic";
type Params = Record<string, string | string[] | undefined>;
// Each category is its own page in search results. Searches and filtered views are the same
// products in another order, so they point back to the page they are a view of and stay out
// of the index.
export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const slug = typeof params.category === "string" ? params.category : "";
  const category = slug
    ? (await getCategories().catch(() => [])).find((c) => c.slug === slug)
    : undefined;
  const filtered = Object.keys(params).some((k) => k !== "category");
  return pageMeta({
    title: category ? `${category.name} in Sri Lanka` : "Shop all furniture",
    description: category
      ? `${category.description || `Shop ${category.name.toLowerCase()} at Forma & Co.`} Islandwide delivery in Sri Lanka, secure PayHere checkout and cash on delivery.`.slice(
          0,
          300,
        )
      : "Browse the full Forma & Co. furniture collection: sofas, beds, dining tables, chairs, desks and storage. Filter by room, material, colour and price.",
    path: category ? `/products?category=${category.slug}` : "/products",
    index: !filtered && (!slug || Boolean(category)),
  });
}
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
  const category = categories.find((c) => c.slug === initial.category);
  return (
    <div className="container page-space">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "ItemList",
            numberOfItems: total,
            itemListElement: items.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: p.name,
              url: absolute(`/products/${p.slug}`),
            })),
          }),
        }}
      />
      <div className="page-heading">
        <span className="eyebrow">The collection</span>
        {/* A category page is headed by the category itself, for shoppers and search engines. */}
        <h1>{category ? category.name : "Find your everyday favourite."}</h1>
        <p>{category?.description || "Considered pieces for every corner of your home."}</p>
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

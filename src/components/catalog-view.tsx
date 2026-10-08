import Link from "next/link";
import { browse, getCategories } from "@/services/catalog";
import { facets, PAGE_SIZE, parseFilter } from "@/lib/catalog-filter";
import { absolute, jsonLd, pageMeta } from "@/lib/seo";
import { ProductBrowser } from "@/components/product-browser";
export type CatalogParams = Record<string, string | string[] | undefined>;
const one = (params: CatalogParams, key: string) =>
  typeof params[key] === "string" ? (params[key] as string) : undefined;
// How many pages of products to show: ?page=3 shows the first three pages together, so the
// address a "Load more" link points to always contains everything before it too.
const pageOf = (params: CatalogParams) =>
  Math.min(50, Math.max(1, Math.floor(Number(one(params, "page"))) || 1));
export const catalogPath = (slug?: string) => (slug ? `/category/${slug}` : "/products");

// Titles and search settings for the catalogue, shared by /products and /category/[slug].
// Each category is its own page in search results. Searches and filtered views are the same
// products in another order, so they point back to the page they are a view of and stay out
// of the index. Further pages of a listing are indexed under their own address.
export async function catalogMetadata(params: CatalogParams, slug?: string) {
  const category = slug
    ? (await getCategories().catch(() => [])).find((c) => c.slug === slug)
    : undefined;
  const filtered = Object.keys(params).some((k) => k !== "page");
  // A page number beyond the end of the list is the same as the last real page.
  const { total } = await browse({ category: category?.slug }, 1, 1);
  const page = Math.min(pageOf(params), Math.max(1, Math.ceil(total / PAGE_SIZE)));
  const title = category ? `${category.name} in Sri Lanka` : "Shop all furniture";
  return pageMeta({
    title: page > 1 ? `${title} (page ${page})` : title,
    description: category
      ? `${category.description || `Shop ${category.name.toLowerCase()} at Forma & Co.`} Islandwide delivery in Sri Lanka, secure PayHere checkout and cash on delivery.`.slice(
          0,
          300,
        )
      : "Browse the full Forma & Co. furniture collection: sofas, beds, dining tables, chairs, desks and storage. Filter by room, material, colour and price.",
    path: `${catalogPath(category?.slug)}${page > 1 && !filtered ? `?page=${page}` : ""}`,
    index: !filtered,
  });
}

// The catalogue page itself: heading, structured data, and the filterable product list.
export async function CatalogView({ params, slug }: { params: CatalogParams; slug?: string }) {
  const initial = { ...parseFilter((key) => one(params, key)), category: slug };
  const page = pageOf(params);
  // Only the pages asked for are sent to the browser; the rest arrives as the shopper asks.
  const { items, total, products, categories } = await browse(initial, 1, PAGE_SIZE * page);
  const category = categories.find((c) => c.slug === slug);
  const parent = categories.find((c) => c.id === category?.parent_id);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Collection", path: "/products" },
    ...(parent ? [{ name: parent.name, path: catalogPath(parent.slug) }] : []),
    ...(category ? [{ name: category.name, path: catalogPath(category.slug) }] : []),
  ];
  return (
    <div className="container page-space">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd([
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              numberOfItems: total,
              itemListElement: items.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: p.name,
                url: absolute(`/products/${p.slug}`),
              })),
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: crumbs.map((c, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: c.name,
                item: absolute(c.path),
              })),
            },
          ]),
        }}
      />
      {category && (
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          {crumbs.slice(0, -1).map((c) => (
            <span key={c.path}>
              <Link href={c.path}>{c.name}</Link> <span>/</span>{" "}
            </span>
          ))}
          <span>{category.name}</span>
        </nav>
      )}
      <div className="page-heading">
        <span className="eyebrow">The collection</span>
        {/* A category page is headed by the category itself, for shoppers and search engines. */}
        <h1>{category ? category.name : "Find your everyday favourite."}</h1>
        <p>{category?.description || "Considered pieces for every corner of your home."}</p>
      </div>
      <h2 className="sr-only">Products</h2>
      <ProductBrowser
        key={`${slug || ""}:${JSON.stringify(params)}`}
        first={{ items, total }}
        facets={facets(products, categories)}
        categories={categories}
        initial={initial}
        focusSearch={params.search === "1"}
      />
    </div>
  );
}

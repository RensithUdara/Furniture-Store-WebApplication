"use client";
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { childSlugs, filterProducts, sortOptions } from "@/lib/catalog-filter";
import type { Product, Category } from "@/types";
export function ProductBrowser({
  products,
  categories,
  initialCategory = "",
  initialQuery = "",
  initialSort = "newest",
  focusSearch = false,
}: {
  products: Product[];
  categories: Category[];
  initialCategory?: string;
  initialQuery?: string;
  initialSort?: string;
  focusSearch?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery),
    [category, setCategory] = useState(initialCategory),
    [sort, setSort] = useState(initialSort),
    [min, setMin] = useState(""),
    [max, setMax] = useState(""),
    [inStock, setInStock] = useState(false),
    [showFilters, setShowFilters] = useState(false);
  const filtered = useMemo(
    () =>
      filterProducts(products, {
        q: query,
        category,
        children: childSlugs(categories, category),
        min: min ? Number(min) : undefined,
        max: max ? Number(max) : undefined,
        inStock,
        sort,
      }),
    [products, categories, category, query, min, max, inStock, sort],
  );
  // Keep the address bar shareable without a server round trip.
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("category", category);
    if (sort !== "newest") params.set("sort", sort);
    const search = params.toString();
    window.history.replaceState(null, "", search ? `?${search}` : window.location.pathname);
  }, [query, category, sort]);
  // Parents first, each followed by its sub-categories.
  const ordered = categories
    .filter((c) => !c.parent_id)
    .flatMap((c) => [c, ...categories.filter((s) => s.parent_id === c.id)]);
  function reset() {
    setQuery("");
    setCategory("");
    setMin("");
    setMax("");
    setInStock(false);
    setSort("newest");
  }
  const active = [query, category, min, max, inStock].filter(Boolean).length;
  return (
    <>
      <div className="catalog-tools">
        <div className="search-field">
          <Search size={19} />
          <input
            aria-label="Search furniture"
            placeholder="Search sofas, oak, linen…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus={focusSearch}
          />
          {query && (
            <button className="icon-button" onClick={() => setQuery("")} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </div>
        <label className="sort-label">
          Sort by
          <select aria-label="Sort products" value={sort} onChange={(e) => setSort(e.target.value)}>
            {sortOptions.map(([value, name]) => (
              <option key={value} value={value}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="catalog-layout">
        <button
          type="button"
          className="filters-toggle"
          aria-expanded={showFilters}
          aria-controls="catalog-filters"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={17} /> {showFilters ? "Hide filters" : "Show filters"}
          {active > 0 && <span className="filter-count">{active}</span>}
        </button>
        <aside id="catalog-filters" className={`filters${showFilters ? " is-open" : ""}`}>
          <h3>
            <SlidersHorizontal size={17} /> Filters
            {active > 0 && <span className="filter-count">{active}</span>}
          </h3>
          <fieldset>
            <legend>Category</legend>
            {[{ id: "all", name: "All furniture", slug: "", parent_id: null }, ...ordered].map(
              (c) => (
                <label className={`filter-option${c.parent_id ? " is-child" : ""}`} key={c.id}>
                  <input
                    type="radio"
                    name="category"
                    checked={category === c.slug}
                    onChange={() => setCategory(c.slug)}
                  />
                  {c.name}
                  <span>
                    {
                      filterProducts(products, {
                        category: c.slug,
                        children: childSlugs(categories, c.slug),
                      }).length
                    }
                  </span>
                </label>
              ),
            )}
          </fieldset>
          <fieldset>
            <legend>Price range (Rs.)</legend>
            <div className="price-inputs">
              <input
                type="number"
                min="0"
                aria-label="Minimum price"
                placeholder="Min"
                value={min}
                onChange={(e) => setMin(e.target.value)}
              />
              <span>–</span>
              <input
                type="number"
                min="0"
                aria-label="Maximum price"
                placeholder="Max"
                value={max}
                onChange={(e) => setMax(e.target.value)}
              />
            </div>
            <label className="filter-option">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
              />
              In stock only
            </label>
          </fieldset>
          <button className="text-link" onClick={reset} disabled={!active && sort === "newest"}>
            Reset filters <X size={14} />
          </button>
        </aside>
        <div>
          <p className="result-count" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
            {category && ` in ${categories.find((c) => c.slug === category)?.name || category}`}
          </p>
          {filtered.length ? (
            <div className="product-grid catalog-grid">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search size={34} />
              <h2>No pieces found.</h2>
              <p>Try another search or give your filters a little more room.</p>
              <button className="button" onClick={reset}>
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

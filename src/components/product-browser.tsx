"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { api } from "@/lib/client-api";
import {
  COLOURS,
  filterParams,
  PAGE_SIZE,
  sortOptions,
  type CatalogFilter,
  type Facets,
} from "@/lib/catalog-filter";
import type { Product, Category } from "@/types";
type Page = { items: Product[]; total: number };
const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
// The catalogue is filtered and paged on the server. This component keeps the chosen filters,
// asks for the first page whenever they change, and appends the next page on "Load more".
export function ProductBrowser({
  first,
  facets,
  categories,
  initial,
  focusSearch = false,
}: {
  first: Page;
  facets: Facets;
  categories: Category[];
  initial: CatalogFilter;
  focusSearch?: boolean;
}) {
  const [query, setQuery] = useState(initial.q || ""),
    [category, setCategory] = useState(initial.category || ""),
    [sort, setSort] = useState(initial.sort || "newest"),
    [min, setMin] = useState(initial.min === undefined ? "" : String(initial.min)),
    [max, setMax] = useState(initial.max === undefined ? "" : String(initial.max)),
    [inStock, setInStock] = useState(Boolean(initial.inStock)),
    [materials, setMaterials] = useState(initial.materials || []),
    [colours, setColours] = useState(initial.colours || []),
    [sizes, setSizes] = useState(initial.sizes || []),
    [rooms, setRooms] = useState(initial.rooms || []),
    [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState<Page>(first),
    [busy, setBusy] = useState(false),
    [more, setMore] = useState(false),
    [error, setError] = useState("");
  const search = useMemo(
    () =>
      filterParams({
        q: query.trim(),
        category,
        min: min ? Number(min) : undefined,
        max: max ? Number(max) : undefined,
        inStock,
        materials,
        colours,
        sizes,
        rooms,
        sort,
      }).toString(),
    [query, category, min, max, inStock, materials, colours, sizes, rooms, sort],
  );
  // The server already rendered the first page for the filters in the address bar.
  const loaded = useRef(search);
  useEffect(() => {
    window.history.replaceState(null, "", search ? `?${search}` : window.location.pathname);
    if (loaded.current === search) return;
    const stop = new AbortController();
    // A short pause, so typing a word is one request instead of one per letter.
    const timer = setTimeout(async () => {
      setBusy(true);
      setError("");
      try {
        const response = await fetch(`/api/products?${search}&page=1&limit=${PAGE_SIZE}`, {
          signal: stop.signal,
        });
        if (!response.ok) throw new Error();
        const data = (await response.json()) as Page;
        loaded.current = search;
        setPage({ items: data.items, total: data.total });
      } catch {
        if (!stop.signal.aborted) setError("The collection could not be loaded. Please try again.");
      } finally {
        if (!stop.signal.aborted) setBusy(false);
      }
    }, 220);
    return () => {
      clearTimeout(timer);
      stop.abort();
    };
  }, [search]);
  async function loadMore() {
    setMore(true);
    setError("");
    const from = search;
    try {
      const next = Math.floor(page.items.length / PAGE_SIZE) + 1;
      const data = await api<Page>(`/api/products?${search}&page=${next}&limit=${PAGE_SIZE}`);
      // Ignore the answer if the filters changed while it was on its way.
      if (loaded.current === from)
        setPage((p) => ({
          total: data.total,
          items: [...p.items, ...data.items.filter((n) => !p.items.some((o) => o.id === n.id))],
        }));
    } catch {
      setError("More products could not be loaded. Please try again.");
    } finally {
      setMore(false);
    }
  }
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
    setMaterials([]);
    setColours([]);
    setSizes([]);
    setRooms([]);
    setSort("newest");
  }
  const active =
    [query, category, min, max, inStock].filter(Boolean).length +
    materials.length +
    colours.length +
    sizes.length +
    rooms.length;
  const checks = (
    legend: string,
    options: readonly string[],
    chosen: string[],
    set: (next: string[]) => void,
  ) =>
    options.length > 0 && (
      <fieldset>
        <legend>{legend}</legend>
        <div className="filter-scroll">
          {options.map((o) => (
            <label className="filter-option" key={o}>
              <input
                type="checkbox"
                checked={chosen.includes(o)}
                onChange={() => set(toggle(chosen, o))}
              />
              {o}
            </label>
          ))}
        </div>
      </fieldset>
    );
  return (
    <>
      <div className="catalog-tools">
        <div className="search-field">
          <Search size={19} />
          <input
            aria-label="Search furniture"
            placeholder="Search sofas, oak, linen…"
            value={query}
            maxLength={100}
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
                  <span>{facets.categories[c.slug] ?? 0}</span>
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
          {checks("Room", facets.rooms, rooms, setRooms)}
          {checks("Material", facets.materials, materials, setMaterials)}
          {facets.colours.length > 0 && (
            <fieldset>
              <legend>Colour</legend>
              <div className="colour-options">
                {COLOURS.filter((c) => facets.colours.includes(c.name)).map((c) => (
                  <button
                    type="button"
                    key={c.name}
                    className={colours.includes(c.name) ? "selected" : ""}
                    aria-pressed={colours.includes(c.name)}
                    onClick={() => setColours(toggle(colours, c.name))}
                  >
                    <span style={{ background: c.hex }} />
                    {c.name}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          {checks("Size", facets.sizes, sizes, setSizes)}
          <button className="text-link" onClick={reset} disabled={!active && sort === "newest"}>
            Reset filters <X size={14} />
          </button>
        </aside>
        <div aria-busy={busy}>
          <p className="result-count" aria-live="polite">
            {page.total} {page.total === 1 ? "piece" : "pieces"}
            {category && ` in ${categories.find((c) => c.slug === category)?.name || category}`}
          </p>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          {page.items.length ? (
            <>
              <div className={`product-grid catalog-grid${busy ? " is-loading" : ""}`}>
                {page.items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <div className="load-more">
                <p>
                  Showing {page.items.length} of {page.total}
                </p>
                <div
                  role="progressbar"
                  aria-label="Products shown"
                  aria-valuemin={0}
                  aria-valuemax={page.total}
                  aria-valuenow={page.items.length}
                >
                  <span style={{ width: `${(page.items.length / page.total) * 100}%` }} />
                </div>
                {page.items.length < page.total && (
                  <button className="button button-outline" onClick={loadMore} disabled={more}>
                    {more ? "Loading…" : "Load more"}
                  </button>
                )}
              </div>
            </>
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

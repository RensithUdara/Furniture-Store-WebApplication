"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LayoutGrid, Search } from "lucide-react";
import { navigate } from "@/components/navigation-progress";
import { money } from "@/lib/format";
type Suggestions = {
  categories: { name: string; slug: string }[];
  products: { name: string; slug: string; price: number; category: string; image: string }[];
};
const none: Suggestions = { categories: [], products: [] };
// The header search. As the shopper types it lists matching categories and products with a
// thumbnail; Enter (or the button) still opens the full results page.
export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState(""),
    [found, setFound] = useState<Suggestions>(none),
    // The search text the listed suggestions were fetched for.
    [loadedFor, setLoadedFor] = useState(""),
    [open, setOpen] = useState(false),
    [active, setActive] = useState(-1);
  const box = useRef<HTMLFormElement>(null);
  const q = query.trim();
  useEffect(() => {
    if (q.length < 2) return;
    const stop = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/products/suggest?q=${encodeURIComponent(q)}`, {
          signal: stop.signal,
        });
        if (!response.ok) return;
        setFound(await response.json());
        setLoadedFor(q);
        setActive(-1);
        setOpen(true);
      } catch {
        // Suggestions are a convenience; the search itself still works without them.
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      stop.abort();
    };
  }, [q]);
  // Close when the shopper clicks elsewhere.
  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);
  const all = q ? `/products?q=${encodeURIComponent(q)}` : "/products";
  const links =
    q.length < 2
      ? []
      : [
          ...found.categories.map((c) => `/category/${c.slug}`),
          ...found.products.map((p) => `/products/${p.slug}`),
          all,
        ];
  // Nothing is shown until the first answer arrives; after that the previous list stays up
  // while the next one loads, so the dropdown does not flicker between letters.
  const show = open && q.length >= 2 && loadedFor !== "";
  function go(url: string) {
    setOpen(false);
    navigate(router.push, url);
  }
  let row = -1;
  const option = (url: string, className = "") => {
    const index = ++row;
    return {
      id: `suggestion-${index}`,
      role: "option" as const,
      "aria-selected": active === index,
      className: `${className}${active === index ? " is-active" : ""}`,
      href: url,
      onMouseEnter: () => setActive(index),
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        go(url);
      },
    };
  };
  return (
    <form
      ref={box}
      className="nav-search"
      action="/products"
      role="search"
      onSubmit={(e) => {
        // Navigate in the app (no full reload); the plain action still works without script.
        e.preventDefault();
        go(show && active >= 0 ? links[active] : all);
      }}
    >
      <input
        name="q"
        type="search"
        role="combobox"
        aria-label="Search the store"
        aria-expanded={show}
        aria-controls="search-suggestions"
        aria-autocomplete="list"
        aria-activedescendant={show && active >= 0 ? `suggestion-${active}` : undefined}
        autoComplete="off"
        placeholder="Enter products to search…"
        maxLength={100}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (e.target.value.trim().length < 2) setLoadedFor("");
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (!show || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
          e.preventDefault();
          const step = e.key === "ArrowDown" ? 1 : -1;
          // -1 is the text box itself, so the arrows can leave the list again.
          setActive((a) => ((a + 1 + step + links.length + 1) % (links.length + 1)) - 1);
        }}
      />
      <button aria-label="Search">
        <Search size={20} />
      </button>
      {show && (
        <div className="search-suggestions" id="search-suggestions" role="listbox">
          {found.categories.map((c) => (
            <a key={c.slug} {...option(`/category/${c.slug}`, "suggestion-category")}>
              <LayoutGrid size={17} />
              <span>
                {c.name} <small>Category</small>
              </span>
            </a>
          ))}
          {found.products.map((p) => (
            <a key={p.slug} {...option(`/products/${p.slug}`, "suggestion-product")}>
              <img src={p.image} alt="" />
              <span>
                {p.name}
                <small>{p.category}</small>
              </span>
              <b>{money(p.price)}</b>
            </a>
          ))}
          {loadedFor === q && !found.categories.length && !found.products.length && (
            <p className="suggestion-empty">No products match “{q}” yet.</p>
          )}
          <a {...option(all, "suggestion-all")}>
            See all results for “{q}” <ArrowRight size={15} />
          </a>
        </div>
      )}
    </form>
  );
}

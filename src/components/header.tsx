"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  ExternalLink,
  Heart,
  Menu,
  MessageCircle,
  Phone,
  Search,
  ShoppingCart,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useStore } from "@/components/store-provider";
import { useWishlist } from "@/components/wishlist-provider";
import { navigate } from "@/components/navigation-progress";
import { money, phoneNumbers } from "@/lib/format";
import type { Category } from "@/types";
const pages = [
  { href: "/faq", name: "FAQ" },
  { href: "/help", name: "Delivery & care" },
];
const drawerPages = [
  ...pages,
  { href: "/warranty", name: "Warranty" },
  { href: "/refund-policy", name: "Refunds" },
];
export function Header({
  categories,
  user,
}: {
  categories: Category[];
  user: { name: string; admin: boolean } | null;
}) {
  const { items } = useCart();
  const { whatsapp, settings } = useStore();
  const wishlist = useWishlist();
  const count = items.reduce((a, i) => a + i.quantity, 0);
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const router = useRouter();
  useEffect(() => setOpen(false), [path]);
  // Categories and their sub-categories come from the database, so the menu follows the catalog.
  const parents = categories.filter((c) => !c.parent_id);
  const children = (id: string) => categories.filter((c) => c.parent_id === id);
  const initial = user?.name.trim().charAt(0).toUpperCase();
  // The admin sign-in page has no store chrome; the rest of the admin area gets its own slim bar.
  if (path === "/admin") return null;
  if (path.startsWith("/admin"))
    return (
      <header className="navbar admin-bar">
        <div className="container navbar-inner">
          <Link className="wordmark" href="/admin/dashboard">
            forma<span>& co.</span>
            <em>Admin</em>
          </Link>
          <div className="nav-actions">
            <Link href="/" className="nav-action">
              <ExternalLink size={18} /> <span>View store</span>
            </Link>
          </div>
        </div>
      </header>
    );
  return (
    <>
      <div className="topbar">
        <div className="container">
          <span>
            <Truck size={15} />
            {settings
              ? `Free islandwide delivery on orders over ${money(settings.free_delivery_from)}`
              : "Islandwide delivery across Sri Lanka"}
          </span>
          <span className="topbar-contact">
            {phoneNumbers(settings?.store_phone).map((p, i) => (
              <a key={p.tel} href={`tel:${p.tel}`} className={i > 0 ? "extra-phone" : ""}>
                <Phone size={15} /> {p.text}
              </a>
            ))}
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={15} /> +{whatsapp}
              </a>
            )}
          </span>
        </div>
      </div>
      <header className="navbar">
        <div className="container navbar-inner">
          <button
            className="menu-button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
          <Link className="wordmark" href="/">
            forma<span>& co.</span>
          </Link>
          <form
            className="nav-search"
            action="/products"
            role="search"
            onSubmit={(e) => {
              // Navigate in the app (no full reload); the plain action still works without script.
              e.preventDefault();
              const q = String(new FormData(e.currentTarget).get("q") || "").trim();
              navigate(router.push, q ? `/products?q=${encodeURIComponent(q)}` : "/products");
            }}
          >
            <input
              name="q"
              type="search"
              aria-label="Search the store"
              placeholder="Enter products to search…"
              maxLength={100}
            />
            <button aria-label="Search">
              <Search size={20} />
            </button>
          </form>
          <div className="nav-actions">
            <Link href={user ? "/account" : "/login"} className="nav-action">
              {user ? <b className="avatar">{initial}</b> : <UserRound size={24} />}
              <span>{user ? "Account" : "Sign in"}</span>
            </Link>
            {wishlist.enabled && (
              <Link
                href="/account/wishlist"
                className="nav-action"
                aria-label={`Wishlist, ${wishlist.ids.length} items`}
              >
                <span className="cart-icon">
                  <Heart size={24} />
                  {wishlist.ids.length > 0 && <b className="bag-count">{wishlist.ids.length}</b>}
                </span>
                <span>Wishlist</span>
              </Link>
            )}
            <Link href="/cart" className="nav-action" aria-label={`Cart, ${count} items`}>
              <span className="cart-icon">
                <ShoppingCart size={24} />
                <b className="bag-count">{count}</b>
              </span>
              <span>Cart</span>
            </Link>
          </div>
        </div>
        <nav className="nav-row" aria-label="Main navigation">
          <ul className="container">
            <li>
              <Link className={path === "/" ? "active" : ""} href="/">
                Home
              </Link>
            </li>
            {parents.slice(0, 7).map((c) => {
              const subs = children(c.id);
              return (
                <li key={c.id} className={subs.length ? "has-menu" : ""}>
                  <Link href={`/products?category=${c.slug}`}>
                    {c.name} {subs.length > 0 && <ChevronDown size={14} />}
                  </Link>
                  {subs.length > 0 && (
                    <div className="mega">
                      <div>
                        <h3>{c.name}</h3>
                        {c.description && <p>{c.description}</p>}
                        <ul>
                          {subs.map((s) => (
                            <li key={s.id}>
                              <Link href={`/products?category=${s.slug}`}>{s.name}</Link>
                            </li>
                          ))}
                          <li>
                            <Link className="mega-all" href={`/products?category=${c.slug}`}>
                              All {c.name.toLowerCase()}
                            </Link>
                          </li>
                        </ul>
                      </div>
                      {c.image_url && (
                        <Link className="mega-feature" href={`/products?category=${c.slug}`}>
                          <img src={c.image_url} alt="" loading="lazy" />
                          <span>Shop {c.name.toLowerCase()}</span>
                        </Link>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
            <li>
              <Link className={path === "/products" ? "active" : ""} href="/products">
                All products
              </Link>
            </li>
            {pages.map((p) => (
              <li key={p.href}>
                <Link className={path === p.href ? "active" : ""} href={p.href}>
                  {p.name}
                </Link>
              </li>
            ))}
            {user?.admin && (
              <li>
                <Link href="/admin/dashboard">Admin</Link>
              </li>
            )}
          </ul>
        </nav>
      </header>
      {open && (
        <>
          <button
            className="drawer-backdrop"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="drawer" aria-label="Menu">
            <div className="drawer-head">
              <span className="wordmark">
                forma<span>& co.</span>
              </span>
              <button aria-label="Close menu" onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>
            <span className="drawer-label">Shop by category</span>
            <Link className="drawer-parent" href="/products">
              All products
            </Link>
            {parents.map((c) => (
              <div key={c.id}>
                <Link className="drawer-parent" href={`/products?category=${c.slug}`}>
                  {c.name}
                </Link>
                {children(c.id).map((s) => (
                  <Link key={s.id} className="drawer-child" href={`/products?category=${s.slug}`}>
                    {s.name}
                  </Link>
                ))}
              </div>
            ))}
            <span className="drawer-label">Information</span>
            {drawerPages.map((p) => (
              <Link key={p.href} className="drawer-parent" href={p.href}>
                {p.name}
              </Link>
            ))}
            {user?.admin && (
              <Link className="drawer-parent" href="/admin/dashboard">
                Admin panel
              </Link>
            )}
          </aside>
        </>
      )}
    </>
  );
}

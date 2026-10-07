"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Armchair,
  ClipboardList,
  ExternalLink,
  Images,
  KeyRound,
  Layers3,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  TicketPercent,
  Users,
  X,
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { AREAS, type Area } from "@/lib/permissions";
const icons: Record<Area, typeof Users> = {
  dashboard: LayoutDashboard,
  orders: ClipboardList,
  products: Armchair,
  categories: Layers3,
  inventory: Package,
  promos: Images,
  coupons: TicketPercent,
  settings: Settings,
};
// How the areas are grouped in the sidebar.
const groups: { name: string; areas: Area[] }[] = [
  { name: "Overview", areas: ["dashboard"] },
  { name: "Sales", areas: ["orders", "coupons"] },
  { name: "Catalogue", areas: ["products", "categories", "inventory"] },
  { name: "Storefront", areas: ["promos", "settings"] },
];
const team = [
  { href: "/admin/staff", name: "Staff accounts", icon: Users },
  { href: "/admin/roles", name: "Roles", icon: KeyRound },
];
// The admin panel's own frame: sidebar, top bar, and content. It shows only the areas this
// person may use. Hiding a link is a convenience, not the protection: every page, API and
// database policy checks the permission again.
export function AdminShell({
  areas,
  admin,
  roleName,
  name,
  email,
  children,
}: {
  areas: Area[];
  admin: boolean;
  roleName: string;
  name: string;
  email: string;
  children: ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const sections = [
    ...groups.map((g) => ({
      name: g.name,
      links: AREAS.filter((a) => g.areas.includes(a.key) && areas.includes(a.key)).map((a) => ({
        href: a.href,
        name: a.name,
        icon: icons[a.key],
      })),
    })),
    { name: "Team", links: admin ? team : [] },
  ].filter((s) => s.links.length);
  const current = sections.flatMap((s) => s.links).find((l) => path.startsWith(l.href));
  const initial = (name || email).trim().charAt(0).toUpperCase();
  return (
    <div className={`admin-app${open ? " nav-open" : ""}`}>
      <aside className="admin-sidebar" aria-label="Administration">
        <div className="admin-brand">
          <Link className="wordmark" href="/admin">
            forma<span>& co.</span>
          </Link>
          <button className="admin-close" aria-label="Close menu" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav>
          {sections.map((s) => (
            <div key={s.name} className="admin-group">
              <span>{s.name}</span>
              {s.links.map(({ href, name, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={path.startsWith(href) ? "active" : ""}
                  aria-current={path.startsWith(href) ? "page" : undefined}
                >
                  <Icon size={18} />
                  {name}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="admin-user">
          <span className="admin-avatar">{initial}</span>
          <div>
            <strong>{name || email}</strong>
            <small>{roleName}</small>
          </div>
        </div>
      </aside>
      {open && (
        <button className="admin-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />
      )}
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className="admin-crumb">
            <span>Admin</span>
            <strong>{current?.name || "Store management"}</strong>
          </div>
          <div className="admin-topbar-actions">
            <Link href="/" className="admin-store-link">
              <ExternalLink size={16} /> <span>View store</span>
            </Link>
            <LogoutButton />
          </div>
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}

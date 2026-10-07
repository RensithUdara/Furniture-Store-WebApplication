"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gift,
  Heart,
  LayoutDashboard,
  LayoutGrid,
  LockKeyhole,
  MapPin,
  Package,
  UserRound,
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
const links = [
  { href: "/account", name: "Overview", icon: LayoutGrid },
  { href: "/account/orders", name: "My orders", icon: Package },
  { href: "/account/wishlist", name: "Wishlist", icon: Heart },
  { href: "/account/rewards", name: "Reward points", icon: Gift },
  { href: "/account/profile", name: "Profile", icon: UserRound },
  { href: "/account/address", name: "Saved address", icon: MapPin },
  { href: "/account/security", name: "Security", icon: LockKeyhole },
];
export function AccountNav({
  name,
  email,
  admin,
}: {
  name: string;
  email: string;
  admin: boolean;
}) {
  const path = usePathname();
  return (
    <aside className="account-side">
      <div className="account-user">
        <span className="account-avatar">{(name || email).trim().charAt(0).toUpperCase()}</span>
        <div>
          <strong>{name || "Your account"}</strong>
          <small>{email}</small>
        </div>
      </div>
      <nav aria-label="Account">
        {links.map(({ href, name, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={path === href ? "active" : ""}
            aria-current={path === href ? "page" : undefined}
          >
            <Icon size={18} /> {name}
          </Link>
        ))}
        {admin && (
          <Link href="/admin" className="account-admin-link">
            <LayoutDashboard size={18} /> Store admin
          </Link>
        )}
      </nav>
      <div className="account-side-foot">
        <LogoutButton />
      </div>
    </aside>
  );
}

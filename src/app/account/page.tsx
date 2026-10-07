import Link from "next/link";
import {
  ArrowRight,
  CircleCheckBig,
  Gift,
  LockKeyhole,
  MapPin,
  Package,
  ShoppingBag,
  Truck,
  UserRound,
  Wallet,
} from "lucide-react";
import { accountUser, isActiveOrder, orderStats } from "@/lib/account";
import { getOrders } from "@/services/orders";
import { OrderCard } from "@/components/order-history";
import { money } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata = { title: "Your account" };
export default async function Account() {
  const user = await accountUser("/account");
  const orders = await getOrders();
  const stats = orderStats(orders);
  const profile = user.profile;
  const active = orders.filter(isActiveOrder);
  // Finish-your-profile prompts, shown only for what is actually missing.
  const todo = [
    !profile?.phone && {
      href: "/account/profile",
      icon: UserRound,
      text: "Add a phone number so we can reach you about deliveries.",
    },
    profile?.address_line1 === "" && {
      href: "/account/address",
      icon: MapPin,
      text: "Save a delivery address to check out faster.",
    },
  ].filter((t) => !!t);
  const tiles = [
    { name: "Total orders", value: stats.total, icon: Package, href: "/account/orders" },
    { name: "In progress", value: stats.active, icon: Truck, href: "/account/orders" },
    profile?.loyalty_points == null
      ? { name: "Completed", value: stats.delivered, icon: CircleCheckBig, href: "/account/orders" }
      : {
          name: "Reward points",
          value: Number(profile.loyalty_points).toLocaleString("en-LK"),
          icon: Gift,
          href: "/account/rewards",
        },
    { name: "Total paid", value: money(stats.paid), icon: Wallet, href: "/account/orders" },
  ];
  return (
    <>
      <div className="account-hero">
        <div>
          <span className="eyebrow">My account</span>
          <h1>Hello, {profile?.name?.split(" ")[0] || "there"}</h1>
          <p>Track orders, update your details, and manage how you sign in.</p>
        </div>
        <Link className="button" href="/products">
          <ShoppingBag size={17} /> Continue shopping
        </Link>
      </div>
      <div className="stat-grid account-stats">
        {tiles.map(({ name, value, icon: Icon, href }) => (
          <Link className="stat-card" key={name} href={href}>
            <span className="stat-icon">
              <Icon size={18} />
            </span>
            <p>{name}</p>
            <strong>{value}</strong>
          </Link>
        ))}
      </div>
      {todo.length > 0 && (
        <div className="account-todo">
          {todo.map(({ href, icon: Icon, text }) => (
            <Link key={href} href={href}>
              <Icon size={18} />
              <span>{text}</span>
              <ArrowRight size={16} />
            </Link>
          ))}
        </div>
      )}
      <div className="admin-section-title">
        <h2>{active.length ? "Orders in progress" : "Recent orders"}</h2>
        {orders.length > 0 && (
          <Link className="text-link" href="/account/orders">
            View all {orders.length}
          </Link>
        )}
      </div>
      {orders.length ? (
        <div className="order-list">
          {(active.length ? active : orders).slice(0, 3).map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      ) : (
        <div className="empty-state panel">
          <Package size={38} />
          <h2>No orders yet</h2>
          <p>Your orders will appear here with live progress once you place one.</p>
          <Link className="button" href="/products">
            Start shopping <ArrowRight size={16} />
          </Link>
        </div>
      )}
      <div className="admin-section-title">
        <h2>Account settings</h2>
      </div>
      <div className="account-links">
        <Link href="/account/profile">
          <UserRound size={22} />
          <strong>Profile</strong>
          <span>{profile?.name || "Add your name"}</span>
          <span>{profile?.phone || "No phone number yet"}</span>
        </Link>
        <Link href="/account/address">
          <MapPin size={22} />
          <strong>Saved address</strong>
          {profile?.address_line1 ? (
            <>
              <span>{profile.address_line1}</span>
              <span>
                {profile.city} {profile.postal_code}
              </span>
            </>
          ) : (
            <span>No address saved yet</span>
          )}
        </Link>
        <Link href="/account/security">
          <LockKeyhole size={22} />
          <strong>Security</strong>
          <span>{user.email}</span>
          <span>Change your password</span>
        </Link>
      </div>
    </>
  );
}

"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { api } from "@/lib/client-api";
import { navigate } from "@/components/navigation-progress";
type Wishlist = {
  // False until the wishlist table exists (migration 006); the hearts are then hidden.
  enabled: boolean;
  ids: string[];
  toggle: (productId: string) => void;
};
const Context = createContext<Wishlist>({ enabled: false, ids: [], toggle: () => {} });
export function WishlistProvider({
  initial,
  signedIn,
  children,
}: {
  initial: string[] | null;
  signedIn: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const path = usePathname();
  const [ids, setIds] = useState(initial || []);
  function toggle(productId: string) {
    // The wishlist is saved to the account, so visitors are asked to sign in first.
    if (!signedIn) return navigate(router.push, `/login?next=${encodeURIComponent(path)}`);
    const saved = ids.includes(productId);
    const before = ids;
    setIds(saved ? ids.filter((id) => id !== productId) : [productId, ...ids]);
    // Show the change at once; put it back if the server refuses it.
    api("/api/wishlist", saved ? "DELETE" : "POST", { product_id: productId }).catch(() =>
      setIds(before),
    );
  }
  return (
    <Context.Provider value={{ enabled: initial !== null, ids, toggle }}>
      {children}
    </Context.Provider>
  );
}
export const useWishlist = () => useContext(Context);
export function WishButton({
  productId,
  name,
  label = false,
}: {
  productId: string;
  name: string;
  label?: boolean;
}) {
  const { enabled, ids, toggle } = useWishlist();
  if (!enabled) return null;
  const saved = ids.includes(productId);
  return (
    <button
      type="button"
      className={`wish-button${saved ? " saved" : ""}${label ? " with-label" : ""}`}
      aria-pressed={saved}
      aria-label={`${saved ? "Remove" : "Save"} ${name} ${saved ? "from" : "to"} wishlist`}
      onClick={() => toggle(productId)}
    >
      <Heart size={18} fill={saved ? "currentColor" : "none"} />
      {label && (saved ? "Saved to wishlist" : "Add to wishlist")}
    </button>
  );
}

"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { z } from "zod";
import type { CartItem } from "@/types";
const itemSchema = z.object({
  variant_id: z.uuid(),
  product_id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  details: z.string(),
  image: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().min(1).max(20),
  stock: z.number().int().min(0),
});
type CartContextType = {
  items: CartItem[];
  ready: boolean;
  // Chosen on the cart page before checkout; null until the shopper picks one.
  fulfil: Fulfilment | null;
  setFulfil: (value: Fulfilment) => void;
  add: (item: CartItem) => void;
  update: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};
export type Fulfilment = "DELIVERY" | "PICKUP";
const Context = createContext<CartContextType | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [fulfil, setFulfilState] = useState<Fulfilment | null>(null);
  useEffect(() => {
    try {
      const parsed = z
        .array(itemSchema)
        .max(30)
        .safeParse(JSON.parse(localStorage.getItem("forma-cart") || "[]"));
      if (parsed.success) setItems(parsed.data);
      const saved = localStorage.getItem("forma-fulfilment");
      if (saved === "DELIVERY" || saved === "PICKUP") setFulfilState(saved);
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem("forma-cart", JSON.stringify(items));
      } catch {}
    }
  }, [items, ready]);
  function setFulfil(value: Fulfilment | null) {
    setFulfilState(value);
    try {
      if (value) localStorage.setItem("forma-fulfilment", value);
      else localStorage.removeItem("forma-fulfilment");
    } catch {}
  }
  function add(item: CartItem) {
    setItems((prev) => {
      const exists = prev.find((i) => i.variant_id === item.variant_id);
      if (exists)
        return prev.map((i) =>
          i.variant_id === item.variant_id
            ? { ...item, quantity: Math.min(i.quantity + item.quantity, item.stock, 20) }
            : i,
        );
      if (prev.length >= 30) return prev;
      return [...prev, { ...item, quantity: Math.min(item.quantity, item.stock, 20) }];
    });
  }
  return (
    <Context.Provider
      value={{
        items,
        ready,
        fulfil,
        setFulfil,
        add,
        update: (id, quantity) =>
          setItems((p) =>
            p.map((i) =>
              i.variant_id === id
                ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock || 1, 20)) }
                : i,
            ),
          ),
        remove: (id) => setItems((p) => p.filter((i) => i.variant_id !== id)),
        clear: () => {
          setItems([]);
          setFulfil(null);
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useCart() {
  const c = useContext(Context);
  if (!c) throw new Error("Cart provider missing");
  return c;
}

"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { StoreSettings } from "@/types";
// Public store details shared with client components: the WhatsApp number and delivery/pickup settings.
type Store = { whatsapp: string; settings: StoreSettings | null };
const Context = createContext<Store>({ whatsapp: "", settings: null });
export function StoreProvider({ value, children }: { value: Store; children: ReactNode }) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useStore = () => useContext(Context);
export const whatsappLink = (number: string, text: string) =>
  `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

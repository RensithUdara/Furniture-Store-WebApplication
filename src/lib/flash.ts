import type { FlashSale, Product } from "@/types";

// The flash sale that applies to a product right now: among the running ones that include
// it, the biggest discount. This mirrors flash_price() in migration 014, which is the one
// that counts: the database charges the sale price itself when it saves an order.
export function flashFor(productId: string, sales: FlashSale[], now = Date.now()) {
  return sales
    .filter(
      (s) =>
        s.is_active &&
        Date.parse(s.starts_at) <= now &&
        Date.parse(s.ends_at) >= now &&
        (s.all_products || s.product_ids.includes(productId)),
    )
    .sort((a, b) => b.discount_percent - a.discount_percent)[0];
}
export const flashPrice = (price: number, percent: number) =>
  Math.round(price * (100 - percent)) / 100;

// A product as the storefront should show it during a sale: each finish at its sale price,
// with the usual price as its "was" price, so the existing sale badges and struck-through
// prices apply without any other change.
export function withFlash(p: Product, sales: FlashSale[]): Product {
  const sale = flashFor(p.id, sales);
  if (!sale) return p;
  const variants = p.product_variants.map((v) => ({
    ...v,
    price: flashPrice(Number(v.price), sale.discount_percent),
    compare_at_price: Math.max(Number(v.price), Number(v.compare_at_price || 0)),
  }));
  const active = variants.filter((v) => v.is_active);
  return {
    ...p,
    price: active.length
      ? Math.min(...active.map((v) => v.price))
      : flashPrice(p.price, sale.discount_percent),
    product_variants: variants,
    flash: { name: sale.name, percent: sale.discount_percent, ends_at: sale.ends_at },
  };
}

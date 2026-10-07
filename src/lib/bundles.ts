import type { Bundle } from "@/types";

type Line = { product_id: string; quantity: number; price: number };

// What the room sets take off a cart. This mirrors bundle_discount() in migration 012, which
// is the one that counts: the database works the discount out again when it saves the order.
// A set counts once for every complete group of its products. Sets with the bigger discount
// are matched first, and a unit that counted towards one set cannot count towards another.
export function bundleDiscount(lines: Line[], bundles: Bundle[]) {
  const left = new Map<string, number>(),
    price = new Map<string, number>();
  for (const l of lines) {
    left.set(l.product_id, (left.get(l.product_id) || 0) + l.quantity);
    price.set(l.product_id, Math.min(price.get(l.product_id) ?? Infinity, l.price));
  }
  let amount = 0;
  const names: string[] = [];
  const ordered = bundles
    .filter((b) => b.is_active && b.product_ids.length >= 2)
    .sort(
      (a, b) => Number(b.discount_percent) - Number(a.discount_percent) || (a.id < b.id ? -1 : 1),
    );
  for (const b of ordered) {
    const sets = Math.min(...b.product_ids.map((id) => left.get(id) || 0));
    if (sets <= 0) continue;
    const base = b.product_ids.reduce((sum, id) => sum + (price.get(id) || 0), 0);
    amount += Math.round(base * sets * Number(b.discount_percent)) / 100;
    names.push(b.name);
    for (const id of b.product_ids) left.set(id, (left.get(id) || 0) - sets);
  }
  return { amount: Math.round(amount * 100) / 100, names };
}

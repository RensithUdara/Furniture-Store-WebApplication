import { NextResponse } from "next/server";
import { browse } from "@/services/catalog";
import { childSlugs, filterProducts, PAGE_SIZE, parseFilter } from "@/lib/catalog-filter";
import { requirePermission } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { productSchema } from "@/lib/validation";
import { apiError, checkOrigin, dbError, readJson } from "@/lib/http";
// Public catalog. Optional filters:
// ?q=&category=&min=&max=&in_stock=1&material=&colour=&size=&room=&sort=price-low
// (several materials, colours, sizes or rooms are joined with "|").
// Without ?page it returns every match as an array. With ?page=1 (and optionally &limit=,
// up to 60) it returns one page: { items, total, page, pages }.
export async function GET(request: Request) {
  try {
    const q = new URL(request.url).searchParams;
    const filter = parseFilter((key) => q.get(key));
    if (!q.has("page")) {
      const { products, categories } = await browse({}, 1, 0);
      return NextResponse.json(
        filterProducts(products, {
          ...filter,
          children: filter.category ? childSlugs(categories, filter.category) : undefined,
        }),
      );
    }
    const page = Math.min(10000, Math.max(1, Math.floor(Number(q.get("page"))) || 1));
    const limit = Math.min(60, Math.max(1, Math.floor(Number(q.get("limit"))) || PAGE_SIZE));
    const { items, total } = await browse(filter, page, limit);
    return NextResponse.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await requirePermission("products");
    const input = productSchema.parse(await readJson(request));
    const db = await supabase();
    const { data, error } = await db.rpc("save_product", { p: input });
    if (error) dbError(error);
    return NextResponse.json({ id: data }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}

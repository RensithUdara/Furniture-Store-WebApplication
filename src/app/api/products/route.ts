import { NextResponse } from "next/server";
import { getCategories, getProducts } from "@/services/catalog";
import { childSlugs, filterProducts } from "@/lib/catalog-filter";
import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { productSchema } from "@/lib/validation";
import { apiError, checkOrigin, dbError, readJson } from "@/lib/http";
// Public catalog. Optional filters: ?q=&category=&min=&max=&in_stock=1&sort=price-low
export async function GET(request: Request) {
  try {
    const q = new URL(request.url).searchParams;
    const amount = (key: string) => {
      const n = Number(q.get(key));
      return q.get(key) && Number.isFinite(n) && n >= 0 ? n : undefined;
    };
    const category = q.get("category") || undefined;
    return NextResponse.json(
      filterProducts(await getProducts(), {
        q: q.get("q")?.slice(0, 100),
        category,
        children: category ? childSlugs(await getCategories(), category) : undefined,
        min: amount("min"),
        max: amount("max"),
        inStock: q.get("in_stock") === "1",
        sort: q.get("sort") || undefined,
      }),
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await requireAdmin();
    const input = productSchema.parse(await readJson(request));
    const db = await supabase();
    const { data, error } = await db.rpc("save_product", { p: input });
    if (error) dbError(error);
    return NextResponse.json({ id: data }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}

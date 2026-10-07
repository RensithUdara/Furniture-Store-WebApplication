import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/config";
import { apiError } from "@/lib/http";
// Search-as-you-type for the header: a few matching categories and products, with only the
// fields the dropdown shows. Every word typed must appear in the product's name.
export async function GET(request: Request) {
  try {
    const words = (new URL(request.url).searchParams.get("q") || "")
      .slice(0, 100)
      // % and _ are wildcards in a LIKE pattern; the rest would break the filter syntax.
      .replace(/[%_\\,()*"]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 6);
    if (!isConfigured() || words.join("").length < 2)
      return NextResponse.json({ products: [], categories: [] });
    const db = await supabase();
    let products = db
      .from("products")
      .select("name,slug,price,categories!inner(name,is_active),product_images(image_url,sort_order)")
      .eq("is_active", true)
      .eq("categories.is_active", true)
      .order("is_featured", { ascending: false })
      .order("name")
      .limit(6);
    let categories = db.from("categories").select("name,slug").eq("is_active", true).limit(3);
    for (const w of words) {
      products = products.ilike("name", `%${w}%`);
      categories = categories.ilike("name", `%${w}%`);
    }
    const [p, c] = await Promise.all([products, categories]);
    if (p.error) throw p.error;
    if (c.error) throw c.error;
    return NextResponse.json({
      categories: c.data,
      products: p.data.map((row) => {
        const category = row.categories as unknown as { name: string };
        const images = [...row.product_images].sort((a, b) => a.sort_order - b.sort_order);
        return {
          name: row.name,
          slug: row.slug,
          price: Number(row.price),
          category: category?.name || "",
          image: images[0]?.image_url || "/images/living.jpg",
        };
      }),
    });
  } catch (e) {
    return apiError(e);
  }
}

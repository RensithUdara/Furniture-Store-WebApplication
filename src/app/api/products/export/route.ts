import { requirePermission } from "@/lib/auth";
import { getProducts } from "@/services/catalog";
import { PRODUCT_COLUMNS } from "@/lib/product-sheet";
import { toCsv } from "@/lib/spreadsheet";
import { apiError } from "@/lib/http";
const yes = (v: boolean) => (v ? "yes" : "no");
// Every product as a spreadsheet, one row per finish, in the layout the import reads.
export async function GET() {
  try {
    await requirePermission("products");
    const products = await getProducts(true);
    const rows = products.flatMap((p) =>
      p.product_variants.map((v) => [
        p.slug,
        p.name,
        p.categories?.slug || "",
        p.brand,
        p.description,
        p.material,
        p.dimensions,
        yes(p.is_active),
        yes(p.is_featured),
        p.product_images.map((i) => i.image_url).join(" | "),
        v.sku,
        v.color,
        v.color_hex,
        v.material,
        Number(v.price),
        v.compare_at_price ? Number(v.compare_at_price) : "",
        v.stock_quantity,
        v.reorder_level ?? "",
        yes(v.is_active),
      ]),
    );
    return new Response(toCsv([[...PRODUCT_COLUMNS], ...rows]), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="forma-products.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}

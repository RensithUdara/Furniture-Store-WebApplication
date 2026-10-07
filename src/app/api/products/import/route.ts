import { NextResponse, after } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { getCategories, getProducts } from "@/services/catalog";
import { notifyLowStock } from "@/services/admin";
import { productSchema } from "@/lib/validation";
import { MAX_IMPORT_ROWS, type ImportResult, type ProductRow } from "@/lib/product-sheet";
import { apiError, checkOrigin, readJson } from "@/lib/http";
const body = z.object({
  rows: z
    .array(z.record(z.string(), z.string().max(6000)))
    .min(1)
    .max(MAX_IMPORT_ROWS),
});
const flag = (value: string | undefined, fallback: boolean) =>
  !value
    ? fallback
    : /^(yes|y|true|1)$/i.test(value)
      ? true
      : /^(no|n|false|0)$/i.test(value)
        ? false
        : fallback;
const amount = (value: string) => Number(value.replace(/[,\s]|rs\.?/gi, ""));
// Creates and updates products from spreadsheet rows (one row per finish, grouped by slug).
// An empty cell means "leave as it is" for an existing product. Each product is saved on its
// own, through the same validation and database function as the product form, so one bad row
// never stops the rest; the answer lists what happened to each product.
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await requirePermission("products");
    const { rows } = body.parse(await readJson(request));
    const db = await supabase();
    const [products, categories] = await Promise.all([getProducts(true), getCategories(true)]);
    const groups = new Map<string, ProductRow[]>();
    for (const row of rows as ProductRow[]) {
      const slug = (row.slug || "").trim().toLowerCase();
      if (slug) groups.set(slug, [...(groups.get(slug) || []), row]);
    }
    const results: ImportResult[] = [];
    for (const [slug, group] of groups) {
      const existing = products.find((p) => p.slug === slug);
      // The first row that fills a column in decides it for the product.
      const cell = (key: keyof ProductRow) => group.find((r) => r[key])?.[key] || "";
      const name = cell("name") || existing?.name || "";
      const fail = (message: string) => results.push({ slug, name, status: "error", message });
      const wanted = cell("category").toLowerCase();
      const category = wanted
        ? categories.find((c) => c.slug === wanted || c.name.toLowerCase() === wanted)
        : categories.find((c) => c.id === existing?.category_id);
      if (!category) {
        fail(
          wanted
            ? `There is no category "${cell("category")}".`
            : "A new product needs a category.",
        );
        continue;
      }
      const variants = (existing?.product_variants || []).map((v) => ({
        id: v.id,
        sku: v.sku,
        color: v.color,
        color_hex: v.color_hex,
        material: v.material,
        price: Number(v.price),
        compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : null,
        stock_quantity: v.stock_quantity,
        is_active: v.is_active,
      }));
      // Stock and reorder levels of finishes that already exist are changed after the save.
      const stock: { id: string; quantity: number }[] = [],
        levels: { id: string; level: number }[] = [];
      let problem = "";
      for (const r of group) {
        const sku = (r.sku || "").trim();
        if (!sku) {
          problem = "Every row needs a SKU.";
          break;
        }
        let v = variants.find((x) => x.sku.toLowerCase() === sku.toLowerCase());
        const isNew = !v;
        if (!v) {
          v = {
            id: crypto.randomUUID(),
            sku,
            color: "Natural",
            color_hex: "#b9aa94",
            material: cell("material") || existing?.material || "",
            price: 0,
            compare_at_price: null,
            stock_quantity: 0,
            is_active: true,
          };
          variants.push(v);
        }
        if (r.colour) v.color = r.colour;
        if (r.colour_hex)
          v.color_hex = r.colour_hex.startsWith("#") ? r.colour_hex : `#${r.colour_hex}`;
        if (r.finish_material) v.material = r.finish_material;
        if (r.price) v.price = amount(r.price);
        // "0" or "-" removes a sale price; an empty cell leaves it alone.
        if (r.was_price)
          v.compare_at_price = /^(0|-)$/.test(r.was_price) ? null : amount(r.was_price);
        v.is_active = flag(r.finish_active, v.is_active);
        if (r.stock) {
          const quantity = Number(r.stock);
          if (!Number.isInteger(quantity) || quantity < 0 || quantity > 100000) {
            problem = `Stock for ${sku} must be a whole number from 0 to 100000.`;
            break;
          }
          if (isNew) v.stock_quantity = quantity;
          else if (quantity !== v.stock_quantity) stock.push({ id: v.id, quantity });
        }
        if (r.reorder_level) {
          const level = Number(r.reorder_level);
          if (!Number.isInteger(level) || level < 0 || level > 100000) {
            problem = `Reorder level for ${sku} must be a whole number from 0 to 100000.`;
            break;
          }
          levels.push({ id: v.id, level });
        }
      }
      if (problem) {
        fail(problem);
        continue;
      }
      const priced = variants.filter((v) => v.is_active).length
        ? variants.filter((v) => v.is_active)
        : variants;
      const images = cell("images")
        ? cell("images")
            .split("|")
            .map((u) => u.trim())
            .filter(Boolean)
        : existing?.product_images.map((i) => i.image_url) || ["/images/living.jpg"];
      const parsed = productSchema.safeParse({
        id: existing?.id,
        category_id: category.id,
        name,
        slug,
        description: cell("description") || existing?.description || "",
        price: Math.min(...priced.map((v) => v.price)),
        brand: cell("brand") || existing?.brand || "Forma & Co.",
        material: cell("material") || existing?.material || "",
        dimensions: cell("dimensions") || existing?.dimensions || "",
        is_active: flag(cell("visible"), existing?.is_active ?? true),
        is_featured: flag(cell("featured"), existing?.is_featured ?? false),
        images,
        variants,
        // Not in the spreadsheet: keep what the product already has.
        ...(existing?.rooms !== undefined
          ? {
              rooms: existing.rooms,
              size: existing.size || "",
              video_url: existing.video_url || "",
            }
          : {}),
      });
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        fail(`${issue.path.join(" ") || "Row"}: ${issue.message}`);
        continue;
      }
      const { error } = await db.rpc("save_product", { p: parsed.data });
      if (error) {
        fail(
          error.code === "23505"
            ? "A SKU or slug in these rows is already used by another product."
            : error.message,
        );
        continue;
      }
      const notes: string[] = [];
      for (const s of stock) {
        const { error: stockError } = await db.rpc("adjust_stock", {
          p_variant: s.id,
          p_quantity: s.quantity,
          p_previous: null,
          p_reason: "IMPORT",
          p_note: "Spreadsheet import",
        });
        // Before migration 013 there is no logged function: change the figure directly.
        if (stockError?.code === "PGRST202")
          await db.from("product_variants").update({ stock_quantity: s.quantity }).eq("id", s.id);
        else if (stockError) notes.push(`stock not changed (${stockError.message})`);
      }
      for (const l of levels) {
        const { error: levelError } = await db
          .from("product_variants")
          .update({ reorder_level: l.level })
          .eq("id", l.id);
        if (levelError && !notes.includes("reorder levels are not available yet"))
          notes.push("reorder levels are not available yet");
      }
      results.push({
        slug,
        name,
        status: existing ? "updated" : "created",
        message: [`${group.length} ${group.length === 1 ? "finish" : "finishes"}`, ...notes].join(
          "; ",
        ),
      });
    }
    after(notifyLowStock);
    return NextResponse.json({ results });
  } catch (e) {
    return apiError(e);
  }
}

import { NextResponse } from "next/server";
import { getProduct } from "@/services/catalog";
import { requirePermission } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { apiError, checkOrigin, dbError, HttpError, readJson } from "@/lib/http";
import { productStatusSchema } from "@/lib/validation";
import { z } from "zod";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await getProduct((await params).id);
    if (!p) throw new HttpError(404, "Product not found.");
    return NextResponse.json(p);
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    checkOrigin(request);
    await requirePermission("products");
    const id = z.uuid().parse((await params).id);
    const db = await supabase();
    const { error } = await db.from("products").update({ is_active: false }).eq("id", id);
    if (error) dbError(error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
// Show or hide a product without touching its content, variants, or stock.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    checkOrigin(request);
    await requirePermission("products");
    const id = z.uuid().parse((await params).id);
    const input = productStatusSchema.parse(await readJson(request));
    const db = await supabase();
    const { data, error } = await db.from("products").update(input).eq("id", id).select("id");
    if (error) dbError(error);
    if (!data?.length) throw new HttpError(404, "Product not found.");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}

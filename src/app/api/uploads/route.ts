import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { can, type Area } from "@/lib/permissions";
import { supabase } from "@/lib/supabase/server";
import { apiError, checkOrigin, HttpError } from "@/lib/http";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requirePermission("products", "categories", "promos");
    if (Number(request.headers.get("content-length")) > 6 * 1024 * 1024)
      throw new HttpError(413, "Images must be under 5 MB.");
    const form = await request.formData();
    const file = form.get("file");
    const bucket = form.get("bucket");
    if (
      !(file instanceof File) ||
      !["product-images", "category-images", "promo-images"].includes(String(bucket))
    )
      throw new HttpError(400, "Choose an image and a valid bucket.");
    if (file.size > 5 * 1024 * 1024 || file.size === 0)
      throw new HttpError(400, "Images must be between 1 byte and 5 MB.");
    // Each bucket belongs to one admin area; storage policies enforce the same pairing.
    const area = {
      "product-images": "products",
      "category-images": "categories",
      "promo-images": "promos",
    }[String(bucket)] as Area;
    if (!can(user.profile, area)) throw new HttpError(403, "Your role does not allow this upload.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const ext =
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
        ? "jpg"
        : bytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10"
          ? "png"
          : new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
              new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
            ? "webp"
            : null;
    if (!ext) throw new HttpError(400, "Upload a JPG, PNG, or WebP image.");
    const db = await supabase();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await db.storage.from(String(bucket)).upload(path, bytes, {
      contentType: ext === "jpg" ? "image/jpeg" : `image/${ext}`,
      upsert: false,
    });
    if (error) throw error;
    return NextResponse.json({
      url: db.storage.from(String(bucket)).getPublicUrl(path).data.publicUrl,
    });
  } catch (e) {
    return apiError(e);
  }
}

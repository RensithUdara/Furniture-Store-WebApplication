import { z } from "zod";
import { AREA_KEYS } from "@/lib/permissions";

const text = (max = 200) => z.string().trim().min(1, "This field is required").max(max);
const imageUrl = z
  .string()
  .refine(
    (v) => v === "" || v.startsWith("/images/") || /^https:\/\//.test(v),
    "Use an HTTPS image URL or a local image path",
  );
export const checkoutSchema = z
  .object({
    customer_name: text(100).min(2),
    customer_email: z.email().max(254),
    customer_phone: z
      .string()
      .trim()
      .regex(/^(?:\+94|0)\d{9}$/, "Use a Sri Lankan phone number, e.g. 0771234567"),
    fulfillment_method: z.enum(["DELIVERY", "PICKUP"]).default("DELIVERY"),
    // ISO date-time with an offset, e.g. 2026-10-12T14:00:00+05:30. Required for pickup.
    pickup_at: z.iso.datetime({ offset: true }).optional(),
    shipping_address: z.string().trim().max(400).default(""),
    city: z.string().trim().max(100).default(""),
    postal_code: z.string().trim().max(5).default(""),
    payment_method: z.enum(["PAYHERE", "WHATSAPP", "COD"]),
    // Both are only requests; the database decides the actual discount.
    coupon_code: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9_-]{3,30}$/, "Enter a valid coupon code")
      .optional(),
    redeem_points: z.number().int().min(0).max(9999999).optional(),
    idempotency_key: z.uuid(),
    items: z
      .array(z.object({ variant_id: z.uuid(), quantity: z.number().int().min(1).max(20) }))
      .min(1)
      .max(30),
  })
  .refine((v) => new Set(v.items.map((i) => i.variant_id)).size === v.items.length, {
    message: "Duplicate cart items are not allowed",
    path: ["items"],
  })
  .superRefine((v, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    if (v.fulfillment_method === "PICKUP") {
      if (!v.pickup_at) issue("pickup_at", "Choose a pickup date and time");
      else if (Date.parse(v.pickup_at) < Date.now() + 60 * 60 * 1000)
        issue("pickup_at", "Choose a pickup time at least one hour from now");
      return;
    }
    if (v.pickup_at) issue("pickup_at", "A pickup time only applies to store pickup");
    if (v.shipping_address.length < 5) issue("shipping_address", "Enter your delivery address");
    if (!v.city) issue("city", "Enter your city");
    if (!/^\d{5}$/.test(v.postal_code)) issue("postal_code", "Enter a 5-digit postal code");
  });
export const categorySchema = z.object({
  id: z.uuid().optional(),
  name: text(100),
  slug: text(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(1000),
  image_url: imageUrl,
  is_active: z.boolean(),
  parent_id: z.uuid().nullable().optional(),
});
export const variantSchema = z.object({
  id: z.uuid(),
  sku: text(80),
  color: text(60),
  color_hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  material: text(100),
  price: z.number().positive().max(100000000),
  stock_quantity: z.number().int().min(0).max(100000),
  is_active: z.boolean(),
});
export const productSchema = z
  .object({
    id: z.uuid().optional(),
    category_id: z.uuid(),
    name: text(150),
    slug: text(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: text(5000),
    price: z.number().positive().max(100000000),
    brand: text(100),
    material: text(100),
    dimensions: text(200),
    is_active: z.boolean(),
    is_featured: z.boolean(),
    images: z
      .array(imageUrl.refine((v) => v.length > 0, "Image URL is required"))
      .min(1)
      .max(8),
    variants: z.array(variantSchema).min(1).max(30),
  })
  .refine(
    (v) => new Set(v.variants.map((i) => i.id)).size === v.variants.length,
    "Variant IDs must be unique",
  )
  .refine(
    (v) => new Set(v.variants.map((i) => i.sku)).size === v.variants.length,
    "SKUs must be unique",
  );
const password = z.string().min(8, "Use at least 8 characters").max(128);
export const authSchema = z.object({
  email: z.email().max(254),
  password,
  name: z.string().trim().min(2).max(100).optional(),
});
export const emailSchema = z.object({ email: z.email().max(254) });
export const passwordSchema = z.object({ password });
export const profileSchema = z.object({
  name: text(100).min(2, "Enter your full name"),
  phone: z
    .string()
    .trim()
    .regex(/^(?:(?:\+94|0)\d{9})?$/, "Use a Sri Lankan phone number, e.g. 0771234567"),
});
// A saved delivery address: either complete, or entirely empty to remove it.
export const addressSchema = z
  .object({
    address_line1: z.string().trim().max(200),
    address_line2: z.string().trim().max(190),
    city: z.string().trim().max(100),
    postal_code: z.string().trim().max(5),
  })
  .superRefine((v, ctx) => {
    if (!v.address_line1 && !v.address_line2 && !v.city && !v.postal_code) return;
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    if (v.address_line1.length < 5) issue("address_line1", "Enter your street address");
    if (!v.city) issue("city", "Enter your city");
    if (!/^\d{5}$/.test(v.postal_code)) issue("postal_code", "Enter a 5-digit postal code");
  });
export const productStatusSchema = z.object({ is_active: z.boolean() });
export const statusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
  // Sent by the admin when shipping a delivery, or when correcting the details afterwards.
  tracking_number: z
    .string()
    .trim()
    .max(60)
    .regex(/^[A-Za-z0-9 ./#_-]*$/, "Use letters, numbers, spaces and . / # _ - only")
    .optional(),
  courier: z.string().trim().max(60).optional(),
});
export const settingsSchema = z
  .object({
    delivery_fee: z.number().min(0).max(1000000),
    free_delivery_from: z.number().min(0).max(100000000),
    store_phone: z.string().trim().max(30).optional(),
    pickup_address: z.string().trim().max(300).optional(),
    pickup_open_hour: z.number().int().min(0).max(23).optional(),
    pickup_close_hour: z.number().int().min(1).max(24).optional(),
    points_per_100: z.number().int().min(0).max(100).optional(),
    point_value: z.number().min(0).max(1000).optional(),
    unpaid_expiry_minutes: z.number().int().min(0).max(10080).optional(),
  })
  .refine(
    (v) =>
      v.pickup_open_hour === undefined ||
      v.pickup_close_hour === undefined ||
      v.pickup_open_hour < v.pickup_close_hour,
    { message: "Pickup must open before it closes", path: ["pickup_close_hour"] },
  );
export const slideSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().max(120),
  subtitle: z.string().trim().max(240),
  image_url: imageUrl.refine((v) => v.length > 0, "An image is required"),
  // Internal links only, so a slide can never send shoppers to another site.
  link_url: z
    .string()
    .trim()
    .max(300)
    .regex(/^\/(?!\/)/, "Use a path on this site, such as /products"),
  button_label: z.string().trim().max(40),
  sort_order: z.number().int().min(0).max(9999),
  is_active: z.boolean(),
});
const optionalAmount = z.number().positive().max(100000000).nullable();
export const couponSchema = z
  .object({
    id: z.uuid().optional(),
    code: z
      .string()
      .regex(/^[A-Z0-9_-]{3,30}$/, "Use 3 to 30 letters, numbers, dashes or underscores"),
    description: z.string().trim().max(200),
    discount_type: z.enum(["PERCENT", "FIXED"]),
    discount_value: z.number().positive().max(100000000),
    min_subtotal: z.number().min(0).max(100000000),
    max_discount: optionalAmount,
    starts_at: z.iso.datetime().nullable(),
    ends_at: z.iso.datetime().nullable(),
    usage_limit: z.number().int().positive().max(1000000).nullable(),
    per_user_limit: z.number().int().positive().max(1000),
    is_active: z.boolean(),
  })
  .refine((v) => v.discount_type !== "PERCENT" || v.discount_value <= 100, {
    message: "A percentage discount cannot be more than 100",
    path: ["discount_value"],
  })
  .refine((v) => !v.starts_at || !v.ends_at || v.starts_at < v.ends_at, {
    message: "The coupon must start before it ends",
    path: ["ends_at"],
  });
// Access is "ADMIN" for a full administrator, or the id of a staff role.
const staffAccess = z.union([z.literal("ADMIN"), z.uuid()]);
export const staffCreateSchema = z.object({
  name: text(100).min(2, "Enter their full name"),
  email: z.email().max(254),
  password,
  access: staffAccess,
});
export const staffAccessSchema = z.object({
  id: z.uuid(),
  // "NONE" removes staff access and turns the account back into a customer.
  access: z.union([staffAccess, z.literal("NONE")]),
});
export const staffRoleSchema = z.object({
  id: z.uuid().optional(),
  name: text(60).min(2),
  description: z.string().trim().max(200),
  permissions: z
    .array(z.enum(AREA_KEYS))
    .max(AREA_KEYS.length)
    .transform((list) => [...new Set(list)]),
});
// Tracking an order without signing in: its number, plus the phone or email it was placed with.
export const trackSchema = z.object({
  order_number: z
    .string()
    .trim()
    .regex(/^FRM-[A-F0-9]{12}$/i, "Enter the order number exactly as shown, e.g. FRM-1A2B3C4D5E6F"),
  contact: z.string().trim().min(5, "Enter the phone number or email used on the order").max(254),
});

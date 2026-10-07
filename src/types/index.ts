export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  is_active: boolean;
  parent_id?: string | null;
};
export type Variant = {
  id: string;
  product_id: string;
  sku: string;
  color: string;
  color_hex: string;
  material: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  // The "was" price, when this finish is on sale (migration 011).
  compare_at_price?: number | null;
  // Present once migration 013 has been run: stock at or below this is "low".
  reorder_level?: number;
};
export type ProductImage = { id: string; image_url: string; sort_order: number };
export type Product = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  brand: string;
  material: string;
  dimensions: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  categories: Category;
  product_images: ProductImage[];
  product_variants: Variant[];
  rating?: { avg: number; count: number };
  // Present once migration 012 has been run.
  rooms?: string[];
  size?: string;
  video_url?: string;
  // Set on the storefront while a flash sale on this product is running (migration 014).
  // The variants' prices are already the sale prices.
  flash?: { name: string; percent: number; ends_at: string };
};
// A room set: products that earn a discount when ordered together (migration 012).
export type Bundle = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  discount_percent: number;
  is_active: boolean;
  product_ids: string[];
};
export type CartItem = {
  variant_id: string;
  product_id: string;
  slug: string;
  name: string;
  details: string;
  image: string;
  price: number;
  quantity: number;
  stock: number;
};
export type PaymentMethod = "PAYHERE" | "WHATSAPP" | "COD";
export type OrderStatus =
  "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "CHARGEDBACK";
export type OrderItem = {
  id: string;
  product_id: string;
  variant_id: string;
  product_name: string;
  variant_details: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};
export type Order = {
  id: string;
  order_number: string;
  // Null for a guest order, which is reached with guest_token instead of a sign-in.
  user_id: string | null;
  guest_token?: string;
  district?: string;
  estimated_from?: string | null;
  estimated_to?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  postal_code: string;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  payment_method: PaymentMethod;
  fulfillment_method?: "DELIVERY" | "PICKUP";
  pickup_at?: string | null;
  // Present once migration 008 has been run.
  tracking_number?: string;
  courier?: string;
  // Present once migration 006 has been run.
  coupon_code?: string | null;
  discount_amount?: number;
  points_redeemed?: number;
  points_discount?: number;
  // Present once migration 012 has been run.
  bundle_discount?: number;
  bundle_names?: string;
  // Present once migration 013 has been run.
  refunded_amount?: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  requires_review: boolean;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
};
export type PaymentEvent = {
  id: string;
  order_id: string;
  payment_id: string;
  status_code: number;
  amount: number;
  created_at: string;
};
export type StoreSettings = {
  delivery_fee: number;
  free_delivery_from: number;
  // Present once migration 004 has been run; cash on delivery and pickup are offered only then.
  store_phone?: string;
  pickup_address?: string;
  pickup_open_hour?: number;
  pickup_close_hour?: number;
  // Present once migration 006 has been run; coupons and reward points are offered only then.
  points_per_100?: number;
  point_value?: number;
  // Present once migration 010 has been run. 0 means unpaid online orders are never cancelled.
  unpaid_expiry_minutes?: number;
  // Present once migration 011 has been run.
  return_window_days?: number;
  // Present once migration 014 has been run. 0 means no cart reminders are sent.
  cart_reminder_hours?: number;
};
export type PromoSlide = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  button_label: string;
  sort_order: number;
  is_active: boolean;
};
export type Coupon = {
  id: string;
  code: string;
  description: string;
  discount_type: "PERCENT" | "FIXED";
  discount_value: number;
  min_subtotal: number;
  max_discount: number | null;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  per_user_limit: number;
  used_count: number;
  is_active: boolean;
};
export type LedgerEntry = {
  id: string;
  order_id: string | null;
  points: number;
  reason: "EARNED" | "REDEEMED" | "REFUNDED" | "ADJUSTED";
  created_at: string;
  orders: { order_number: string } | null;
};
export type StaffRole = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
};
export type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
  staff_role_id: string | null;
  created_at: string;
};
// One entry in an order's tracking history (migration 009).
export type OrderEvent = { id: number; event: string; detail: string; created_at: string };
export type Review = {
  id: string;
  product_id: string;
  user_id: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  created_at: string;
};
export type Address = {
  id: string;
  label: string;
  line1: string;
  line2: string;
  city: string;
  district: string;
  postal_code: string;
  is_default: boolean;
};
export type DeliveryZone = {
  district: string;
  min_days: number;
  max_days: number;
  is_active: boolean;
  // This district's own delivery fee; null uses the standard fee (migration 013).
  fee?: number | null;
};
export type StockAlert = {
  id: string;
  variant_id: string;
  email: string;
  created_at: string;
  ready_at: string | null;
  product_variants: {
    color: string;
    material: string;
    sku: string;
    stock_quantity: number;
    products: { name: string; slug: string };
  } | null;
};
export type ReturnRequest = {
  id: string;
  order_id: string;
  reason: "DAMAGED" | "FAULTY" | "WRONG_ITEM" | "CHANGED_MIND" | "OTHER";
  details: string;
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "REFUNDED";
  admin_note: string;
  created_at: string;
  updated_at: string;
};
// Admin tools (migration 013).
export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  loyalty_points: number;
  joined_at: string;
  order_count: number;
  total_spent: number;
  last_order_at: string | null;
};
export type StockMovement = {
  id: number;
  variant_id: string;
  change: number;
  quantity_after: number;
  reason: "INITIAL" | "ORDER" | "RETURNED" | "ADJUSTMENT" | "IMPORT";
  note: string;
  actor_name: string;
  created_at: string;
  product_variants: { sku: string; color: string; products: { name: string } | null } | null;
};
export type Refund = {
  id: string;
  order_id: string;
  amount: number;
  method: "PAYHERE" | "MANUAL";
  reference: string;
  note: string;
  actor_name: string;
  created_at: string;
};
export type Activity = {
  id: number;
  actor_name: string;
  action: string;
  entity: string;
  entity_id: string;
  summary: string;
  created_at: string;
};
// Marketing (migration 014).
export type FlashSale = {
  id: string;
  name: string;
  discount_percent: number;
  starts_at: string;
  ends_at: string;
  all_products: boolean;
  is_active: boolean;
  product_ids: string[];
};
export type Subscriber = {
  id: string;
  email: string;
  created_at: string;
  unsubscribed_at: string | null;
};

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
  user_id: string;
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
  // Present once migration 006 has been run.
  coupon_code?: string | null;
  discount_amount?: number;
  points_redeemed?: number;
  points_discount?: number;
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

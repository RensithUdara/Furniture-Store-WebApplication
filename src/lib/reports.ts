import type { Order, Product } from "@/types";

export type Period = "day" | "week" | "month";
export const PERIODS: Period[] = ["day", "week", "month"];
// Everything is reported in Sri Lanka time (UTC+5:30, no daylight saving).
const SL = 5.5 * 3600000;
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
// The Sri Lanka calendar date of a moment, as YYYY-MM-DD.
export const localDate = (value: string | number | Date) =>
  iso(new Date(new Date(value).getTime() + SL));
export const today = () => localDate(Date.now());
export const addDays = (date: string, days: number) =>
  iso(new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000));
// The period a date falls in: the date itself, the Monday of its week, or its month.
export function bucket(date: string, period: Period) {
  if (period === "month") return date.slice(0, 7);
  if (period === "day") return date;
  const d = new Date(`${date}T00:00:00Z`);
  return addDays(date, -((d.getUTCDay() + 6) % 7));
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function bucketLabel(key: string, period: Period) {
  const [y, m, d] = key.split("-").map(Number);
  if (period === "month") return `${MONTHS[m - 1]} ${y}`;
  return `${period === "week" ? "Week of " : ""}${d} ${MONTHS[m - 1]}`;
}
const next = (key: string, period: Period) => {
  if (period === "day") return addDays(key, 1);
  if (period === "week") return addDays(key, 7);
  const [y, m] = key.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`;
};

export type SalesRow = {
  key: string;
  label: string;
  orders: number;
  items: number;
  // Value of every order that was not cancelled.
  sales: number;
  // The part of it that has been paid, and what was refunded afterwards.
  paid: number;
  refunded: number;
};
export type Report = {
  from: string;
  to: string;
  period: Period;
  rows: SalesRow[];
  totals: Omit<SalesRow, "key" | "label">;
  cancelled: number;
  bestSellers: { name: string; quantity: number; revenue: number; orders: number }[];
  categories: { name: string; quantity: number; revenue: number }[];
  orders: Order[];
};
// Sales between two Sri Lanka dates (inclusive). Cancelled orders are counted separately and
// never add to sales. An order that was paid counts towards "paid"; refunds are shown beside it.
export function salesReport(
  all: Order[],
  products: Product[],
  from: string,
  to: string,
  period: Period,
): Report {
  const inRange = all.filter((o) => {
    const d = localDate(o.created_at);
    return d >= from && d <= to;
  });
  const orders = inRange.filter((o) => o.order_status !== "CANCELLED");
  const rows = new Map<string, SalesRow>();
  // Every period in the range appears, including the ones with no sales.
  for (let k = bucket(from, period); k <= bucket(to, period); k = next(k, period))
    rows.set(k, {
      key: k,
      label: bucketLabel(k, period),
      orders: 0,
      items: 0,
      sales: 0,
      paid: 0,
      refunded: 0,
    });
  const category = new Map(products.map((p) => [p.id, p.categories?.name || "Uncategorised"]));
  const sellers = new Map<string, Report["bestSellers"][number]>();
  const categories = new Map<string, Report["categories"][number]>();
  for (const o of orders) {
    const row = rows.get(bucket(localDate(o.created_at), period));
    if (!row) continue;
    row.orders++;
    row.sales += Number(o.total_amount);
    if (o.payment_status === "PAID") row.paid += Number(o.total_amount);
    row.refunded += Number(o.refunded_amount || 0);
    for (const i of o.order_items) {
      row.items += i.quantity;
      const s = sellers.get(i.product_id) || {
        name: i.product_name,
        quantity: 0,
        revenue: 0,
        orders: 0,
      };
      s.quantity += i.quantity;
      s.revenue += Number(i.subtotal);
      s.orders++;
      sellers.set(i.product_id, s);
      const name = category.get(i.product_id) || "Removed products";
      const c = categories.get(name) || { name, quantity: 0, revenue: 0 };
      c.quantity += i.quantity;
      c.revenue += Number(i.subtotal);
      categories.set(name, c);
    }
  }
  const list = [...rows.values()];
  const sum = (field: "orders" | "items" | "sales" | "paid" | "refunded") =>
    list.reduce((a, r) => a + r[field], 0);
  return {
    from,
    to,
    period,
    rows: list,
    totals: {
      orders: sum("orders"),
      items: sum("items"),
      sales: sum("sales"),
      paid: sum("paid"),
      refunded: sum("refunded"),
    },
    cancelled: inRange.length - orders.length,
    bestSellers: [...sellers.values()].sort(
      (a, b) => b.quantity - a.quantity || b.revenue - a.revenue,
    ),
    categories: [...categories.values()].sort((a, b) => b.revenue - a.revenue),
    orders,
  };
}
// The report's three tables as plain rows, for the CSV and Excel downloads.
export type Sheet = { name: string; rows: (string | number)[][] };
export function reportSheets(r: Report): Sheet[] {
  return [
    {
      name: `Sales by ${r.period}`,
      rows: [
        ["Period", "Orders", "Items sold", "Sales (Rs.)", "Paid (Rs.)", "Refunded (Rs.)"],
        ...r.rows.map((x) => [x.label, x.orders, x.items, x.sales, x.paid, x.refunded]),
        [
          "Total",
          r.totals.orders,
          r.totals.items,
          r.totals.sales,
          r.totals.paid,
          r.totals.refunded,
        ],
      ],
    },
    {
      name: "Best sellers",
      rows: [
        ["Product", "Units sold", "Orders", "Revenue (Rs.)"],
        ...r.bestSellers.map((b) => [b.name, b.quantity, b.orders, b.revenue]),
      ],
    },
    {
      name: "Orders",
      rows: [
        [
          "Order",
          "Date",
          "Customer",
          "Email",
          "Phone",
          "District",
          "Payment method",
          "Payment status",
          "Order status",
          "Subtotal (Rs.)",
          "Delivery (Rs.)",
          "Total (Rs.)",
          "Refunded (Rs.)",
        ],
        ...r.orders.map((o) => [
          o.order_number,
          localDate(o.created_at),
          o.customer_name,
          o.customer_email,
          o.customer_phone,
          o.district || "",
          o.payment_method,
          o.payment_status,
          o.order_status,
          Number(o.subtotal),
          Number(o.delivery_fee),
          Number(o.total_amount),
          Number(o.refunded_amount || 0),
        ]),
      ],
    },
  ];
}

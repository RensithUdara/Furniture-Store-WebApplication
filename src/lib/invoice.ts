import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { dateOnly, dateTime, label, money } from "@/lib/format";
import type { Order, StoreSettings } from "@/types";

// A4 in PDF points. All drawing below works down from the top of the page.
const W = 595.28,
  H = 841.89,
  M = 44,
  // Height kept clear at the bottom of every page for the footer.
  FOOT = 104;
const navy = rgb(0.086, 0.129, 0.243),
  gold = rgb(0.91, 0.643, 0.11),
  ink = rgb(0.1, 0.13, 0.22),
  muted = rgb(0.36, 0.4, 0.47),
  line = rgb(0.886, 0.902, 0.937),
  sand = rgb(0.957, 0.961, 0.976),
  white = rgb(1, 1, 1),
  green = rgb(0.235, 0.404, 0.278),
  amber = rgb(0.72, 0.47, 0.04),
  red = rgb(0.64, 0.25, 0.18);

// The built-in PDF fonts cover Latin text only. Common typographic characters are mapped to
// plain ones and anything else becomes "?", so unusual input can never break the download.
const safe = (value: unknown) =>
  String(value ?? "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—−]/g, "-")
    .replace(/…/g, "...")
    .replace(/[\u00A0\u2009\u202F]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^\x20-\x7E\xA1-\xFF]/g, "?")
    .trim();

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = [];
  let current = "";
  for (const word of safe(text).split(" ")) {
    const next = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(next, size) > width) {
      lines.push(current);
      current = word;
    } else current = next;
  }
  if (current) lines.push(current);
  return lines;
}

export type InvoiceBrand = {
  whatsapp: string;
  site: string;
  settings: StoreSettings | null;
};

export async function invoicePdf(order: Order, brand: InvoiceBrand) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  pdf.setTitle(`Invoice ${order.order_number}`);
  pdf.setAuthor("Forma & Co.");
  pdf.setSubject("Sales invoice");
  pdf.setCreationDate(new Date(order.created_at));

  let page: PDFPage;
  let y = 0;
  const text = (
    value: unknown,
    x: number,
    top: number,
    size = 10,
    font = regular,
    color = ink,
    align: "left" | "right" = "left",
  ) => {
    const s = safe(value);
    page.drawText(s, {
      x: align === "right" ? x - font.widthOfTextAtSize(s, size) : x,
      y: H - top - size,
      size,
      font,
      color,
    });
  };
  const rect = (x: number, top: number, w: number, h: number, color = sand) =>
    page.drawRectangle({ x, y: H - top - h, width: w, height: h, color });
  const rule = (top: number, color = line, thickness = 1) =>
    page.drawLine({
      start: { x: M, y: H - top },
      end: { x: W - M, y: H - top },
      thickness,
      color,
    });

  const host = brand.site.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const contact = [
    brand.settings?.store_phone && `Tel: ${brand.settings.store_phone}`,
    brand.whatsapp && `WhatsApp: +${brand.whatsapp}`,
    host,
  ].filter((v): v is string => Boolean(v));

  // Letterhead: brand band, contact details, and a gold rule. Repeated on every page.
  function letterhead(continued: boolean) {
    page = pdf.addPage([W, H]);
    rect(0, 0, W, 96, navy);
    rect(0, 96, W, 5, gold);
    text("forma", M, 26, 32, bold, white);
    text("& co.", M + bold.widthOfTextAtSize("forma", 32) + 7, 41, 14, bold, gold);
    text("Considered furniture for the way you live", M, 66, 9, regular, rgb(0.81, 0.84, 0.91));
    contact.forEach((c, i) => text(c, W - M, 26 + i * 14, 9.5, regular, white, "right"));
    const address = brand.settings?.pickup_address;
    if (address)
      wrap(address, regular, 8.5, 210)
        .slice(0, 2)
        .forEach((l, i) =>
          text(
            l,
            W - M,
            26 + contact.length * 14 + i * 11,
            8.5,
            regular,
            rgb(0.81, 0.84, 0.91),
            "right",
          ),
        );
    y = 126;
    if (continued) {
      text(`Invoice ${order.order_number} (continued)`, M, y, 11, bold, navy);
      y += 26;
    }
  }
  const columns = { item: M + 10, qty: 352, price: 450, amount: W - M - 10 };
  function tableHead() {
    rect(M, y, W - 2 * M, 24, navy);
    text("ITEM", columns.item, y + 8, 8.5, bold, white);
    text("QTY", columns.qty, y + 8, 8.5, bold, white, "right");
    text("UNIT PRICE", columns.price, y + 8, 8.5, bold, white, "right");
    text("AMOUNT", columns.amount, y + 8, 8.5, bold, white, "right");
    y += 24;
  }

  letterhead(false);

  // Title and payment status.
  text("INVOICE", M, y, 24, bold, navy);
  const status =
    order.order_status === "CANCELLED"
      ? { name: "CANCELLED", color: red }
      : order.payment_status === "PAID"
        ? { name: "PAID", color: green }
        : { name: "PAYMENT PENDING", color: amber };
  const pill = bold.widthOfTextAtSize(status.name, 10) + 24;
  rect(W - M - pill, y + 2, pill, 22, status.color);
  text(status.name, W - M - 12, y + 8, 10, bold, white, "right");
  y += 44;

  // Who it is billed to, and the order facts.
  const pickup = order.fulfillment_method === "PICKUP";
  const top = y;
  text("BILLED TO", M, y, 8.5, bold, muted);
  y += 15;
  text(order.customer_name, M, y, 12, bold);
  y += 18;
  const billing = pickup
    ? ["Collecting from the store"]
    : [...wrap(order.shipping_address, regular, 10, 250), `${order.city} ${order.postal_code}`];
  for (const l of [...billing, order.customer_phone, order.customer_email]) {
    text(l, M, y, 10, regular, muted);
    y += 14;
  }
  const method =
    order.payment_method === "PAYHERE"
      ? "PayHere (online)"
      : order.payment_method === "COD"
        ? pickup
          ? "Cash at pickup"
          : "Cash on delivery"
        : "Arranged on WhatsApp";
  const facts: [string, string][] = [
    ["Invoice no.", order.order_number],
    ["Date", dateOnly(order.created_at)],
    ["Payment", method],
    ["Fulfilment", pickup ? "Store pickup" : "Home delivery"],
    ...(pickup && order.pickup_at
      ? ([["Pickup time", dateTime(order.pickup_at)]] as [string, string][])
      : []),
    ...(order.tracking_number
      ? ([["Tracking", `${order.courier ? `${order.courier} ` : ""}${order.tracking_number}`]] as [
          string,
          string,
        ][])
      : []),
    ["Order status", label(order.order_status).replace(/^./, (c) => c.toUpperCase())],
  ];
  facts.forEach(([name, value], i) => {
    text(name, 340, top + i * 16, 9.5, regular, muted);
    text(value, W - M, top + i * 16, 9.5, bold, ink, "right");
  });
  y = Math.max(y, top + facts.length * 16) + 16;

  // Items. Long orders continue on further pages with the letterhead and table head repeated.
  tableHead();
  order.order_items.forEach((item, index) => {
    const name = wrap(item.product_name, bold, 10, 250);
    const height = 14 + name.length * 13 + 12;
    if (y + height > H - FOOT - 12) {
      letterhead(true);
      tableHead();
    }
    if (index % 2 === 1) rect(M, y, W - 2 * M, height, sand);
    name.forEach((l, i) => text(l, columns.item, y + 9 + i * 13, 10, bold));
    text(item.variant_details, columns.item, y + 9 + name.length * 13, 8.5, regular, muted);
    text(item.quantity, columns.qty, y + 9, 10, regular, ink, "right");
    text(money(item.unit_price), columns.price, y + 9, 10, regular, ink, "right");
    text(money(item.subtotal), columns.amount, y + 9, 10, bold, ink, "right");
    y += height;
  });
  rule(y);
  y += 14;

  // Totals, kept together on one page.
  const totals: [string, string][] = [
    ["Subtotal", money(order.subtotal)],
    [
      pickup ? "Store pickup" : "Delivery",
      pickup || !Number(order.delivery_fee) ? "Free" : money(order.delivery_fee),
    ],
    ...(Number(order.bundle_discount) > 0
      ? ([["Room set saving", `- ${money(Number(order.bundle_discount))}`]] as [string, string][])
      : []),
    ...(Number(order.discount_amount) > 0
      ? ([[`Coupon ${order.coupon_code}`, `- ${money(Number(order.discount_amount))}`]] as [
          string,
          string,
        ][])
      : []),
    ...(Number(order.points_discount) > 0
      ? ([
          [`Reward points (${order.points_redeemed})`, `- ${money(Number(order.points_discount))}`],
        ] as [string, string][])
      : []),
  ];
  if (y + totals.length * 18 + 110 > H - FOOT) letterhead(true);
  for (const [name, value] of totals) {
    text(name, 340, y, 10, regular, muted);
    text(value, columns.amount, y, 10, regular, ink, "right");
    y += 18;
  }
  y += 4;
  rect(330, y, W - M - 330, 32, navy);
  text("TOTAL", 342, y + 11, 11, bold, white);
  text(money(order.total_amount), columns.amount, y + 9, 14, bold, gold, "right");
  y += 52;

  const note =
    order.order_status === "CANCELLED"
      ? "This order was cancelled. No payment is due."
      : order.payment_status === "PAID"
        ? "Payment received in full. Thank you."
        : order.payment_method === "COD"
          ? `Amount due in cash ${pickup ? "when you collect your order" : "on delivery"}.`
          : order.payment_method === "WHATSAPP"
            ? "Payment to be arranged with our team on WhatsApp."
            : "Awaiting confirmation of your online payment.";
  text("PAYMENT", M, y, 8.5, bold, muted);
  text(note, M, y + 14, 10, regular, ink);

  // Footer on every page: a thank-you line, how to reach the store, and where the policies are.
  // Every line is wrapped to the page width, so a long web address can never run off the edge.
  const width = W - 2 * M;
  const reach = [
    brand.settings?.pickup_address,
    brand.settings?.store_phone && `Tel ${brand.settings.store_phone}`,
    brand.whatsapp && `WhatsApp +${brand.whatsapp}`,
  ]
    .filter(Boolean)
    .join("  |  ");
  const footer = [
    ...(reach ? wrap(reach, regular, 8.5, width) : []),
    ...wrap(
      `Warranty, refund policy and terms of use: ${host}/warranty  |  /refund-policy  |  /terms`,
      regular,
      8.5,
      width,
    ),
    "This is a computer-generated bill and does not need a signature.",
  ].slice(0, 5);
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    page = p;
    const top = H - FOOT;
    rect(M, top, width, 2, gold);
    text("Thank you for choosing Forma & Co.", M, top + 14, 11, bold, navy);
    text(`Page ${i + 1} of ${pages.length}`, W - M, top + 15, 8.5, regular, muted, "right");
    footer.forEach((l, n) => text(l, M, top + 34 + n * 12, 8.5, regular, muted));
  });
  return pdf.save();
}

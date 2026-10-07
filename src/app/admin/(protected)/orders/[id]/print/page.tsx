import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { guardAdminPage } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { getOrder } from "@/services/orders";
import { getSettings } from "@/services/settings";
import { dateOnly, dateTime, money, shortDate } from "@/lib/format";
import { PrintButton } from "@/components/admin/order-tools";
export const metadata = { title: "Packing slip and delivery note" };
// Two pages for the warehouse and the driver. The packing slip lists what to pick, with no
// prices. The delivery note has the address, what to collect, and a place to sign.
export default async function PrintOrder({ params }: { params: Promise<{ id: string }> }) {
  if (!(await guardAdminPage("orders"))) return null;
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [o, settings] = await Promise.all([getOrder(id), getSettings()]);
  if (!o) notFound();
  const db = await supabase();
  const { data: variants } = await db
    .from("product_variants")
    .select("id,sku")
    .in(
      "id",
      o.order_items.map((i) => i.variant_id),
    );
  const sku = (variantId: string) => variants?.find((v) => v.id === variantId)?.sku || "";
  const pickup = o.fulfillment_method === "PICKUP";
  const units = o.order_items.reduce((a, i) => a + i.quantity, 0);
  // Cash orders are paid at the door; everything else is settled before it leaves.
  const collect =
    o.payment_method === "COD" && o.payment_status !== "PAID" ? Number(o.total_amount) : 0;
  const head = (title: string) => (
    <header>
      <div>
        <strong className="print-brand">Forma &amp; Co.</strong>
        <span>
          {settings?.pickup_address || "10/12, Galle Road, Hikkaduwa"}
          {settings?.store_phone ? ` · ${settings.store_phone}` : ""}
        </span>
      </div>
      <div>
        <h2>{title}</h2>
        <span>
          Order <strong>{o.order_number}</strong> · {dateOnly(o.created_at)}
        </span>
      </div>
    </header>
  );
  const recipient = (
    <div className="print-box">
      <h3>{pickup ? "Collected by" : "Deliver to"}</h3>
      <p>
        <strong>{o.customer_name}</strong>
        <br />
        {pickup ? (
          <>Store pickup{o.pickup_at ? `, ${dateTime(o.pickup_at)}` : ""}</>
        ) : (
          <>
            {o.shipping_address}
            <br />
            {o.city} {o.postal_code}
            {o.district ? `, ${o.district} district` : ""}
          </>
        )}
        <br />
        {o.customer_phone}
      </p>
    </div>
  );
  return (
    <>
      <div className="admin-heading no-print">
        <div>
          <span className="eyebrow">Order {o.order_number}</span>
          <h1>Packing slip and delivery note</h1>
          <p>Prints as two pages: one for packing, one to go with the delivery.</p>
        </div>
        <div className="admin-actions">
          <Link className="button button-outline" href={`/admin/orders/${o.id}`}>
            <ArrowLeft size={16} /> Order
          </Link>
          <PrintButton />
        </div>
      </div>
      <article className="print-sheet">
        {head("Packing slip")}
        <div className="print-columns">
          {recipient}
          <div className="print-box">
            <h3>Order</h3>
            <p>
              {units} {units === 1 ? "item" : "items"} in {o.order_items.length}{" "}
              {o.order_items.length === 1 ? "line" : "lines"}
              <br />
              {pickup ? "Store pickup" : "Home delivery"}
              {o.courier ? ` · ${o.courier}` : ""}
              {o.tracking_number ? ` · ${o.tracking_number}` : ""}
            </p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th className="print-tick">Packed</th>
              <th>SKU</th>
              <th>Item</th>
              <th>Finish</th>
              <th className="print-number">Qty</th>
            </tr>
          </thead>
          <tbody>
            {o.order_items.map((i) => (
              <tr key={i.id}>
                <td className="print-tick">
                  <span />
                </td>
                <td>{sku(i.variant_id)}</td>
                <td>
                  <strong>{i.product_name}</strong>
                </td>
                <td>{i.variant_details}</td>
                <td className="print-number">
                  <strong>{i.quantity}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="print-sign">
          <span>Packed by</span>
          <span>Checked by</span>
          <span>Date</span>
        </div>
      </article>
      <article className="print-sheet">
        {head("Delivery note")}
        <div className="print-columns">
          {recipient}
          <div className="print-box">
            <h3>{collect ? "Collect on delivery" : "Payment"}</h3>
            {collect ? (
              <p className="print-collect">{money(collect)}</p>
            ) : (
              <p>
                {o.payment_status === "PAID"
                  ? "Paid in full. Nothing to collect."
                  : "Arranged with the store. Nothing to collect."}
              </p>
            )}
            {o.estimated_from && o.estimated_to && !pickup && (
              <p>
                Expected {shortDate(o.estimated_from)}
                {o.estimated_to !== o.estimated_from ? ` to ${shortDate(o.estimated_to)}` : ""}
              </p>
            )}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Finish</th>
              <th className="print-number">Qty</th>
            </tr>
          </thead>
          <tbody>
            {o.order_items.map((i) => (
              <tr key={i.id}>
                <td>
                  <strong>{i.product_name}</strong>
                </td>
                <td>{i.variant_details}</td>
                <td className="print-number">
                  <strong>{i.quantity}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="print-terms">
          Please check the items before signing. By signing, the customer confirms that the items
          listed were received in good condition.
        </p>
        <div className="print-sign">
          <span>Received by (name)</span>
          <span>Signature</span>
          <span>Date and time</span>
        </div>
      </article>
    </>
  );
}

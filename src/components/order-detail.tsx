import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  Download,
  Truck,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";
import { money, dateTime, label, deliveryLabel, shortDate } from "@/lib/format";
import { whatsappMessage } from "@/lib/whatsapp";
import { payhere } from "@/lib/config";
import { Badge, Method } from "@/components/order-table";
import { OrderActions } from "@/components/order-actions";
import type { Order, OrderEvent, PaymentEvent, ReturnRequest, StoreSettings } from "@/types";
import { ReturnPanel } from "@/components/account-extras";
import { OrderProgress, TrackingHistory } from "@/components/order-tracking";
const payhereStatus: Record<number, string> = {
  2: "Success",
  0: "Pending",
  [-1]: "Cancelled",
  [-2]: "Failed",
  [-3]: "Chargeback",
};
export function OrderDetail({
  order: o,
  admin = false,
  created = false,
  returned = false,
  payments = [],
  settings = null,
  events = [],
  guestToken,
  returnRequest = null,
}: {
  order: Order;
  admin?: boolean;
  created?: boolean;
  returned?: boolean;
  payments?: PaymentEvent[];
  settings?: StoreSettings | null;
  events?: OrderEvent[];
  // Set on a guest's order page: it replaces the sign-in for payment and the bill.
  guestToken?: string;
  returnRequest?: ReturnRequest | null;
}) {
  const local = o.customer_phone.replace(/^\+94|^0/, "");
  const pickup = o.fulfillment_method === "PICKUP";
  const windowDays = settings?.return_window_days;
  // The delivery window promised at checkout, until the order has arrived or been cancelled.
  const estimate =
    o.estimated_from && o.estimated_to && !["DELIVERED", "CANCELLED"].includes(o.order_status)
      ? o.estimated_from === o.estimated_to
        ? shortDate(o.estimated_from)
        : `${shortDate(o.estimated_from)} – ${shortDate(o.estimated_to)}`
      : "";
  // When an unpaid online order will be cancelled, if that is switched on.
  const expiry = settings?.unpaid_expiry_minutes;
  const deadline =
    !admin &&
    expiry &&
    o.payment_method === "PAYHERE" &&
    o.order_status === "PENDING" &&
    o.payment_status !== "PAID"
      ? new Date(Date.parse(o.created_at) + expiry * 60000).toISOString()
      : null;
  return (
    <>
      <Link
        className="back-link"
        href={admin ? "/admin/orders" : guestToken ? "/products" : "/account/orders"}
      >
        <ArrowLeft size={15} /> {guestToken ? "Continue shopping" : "All orders"}
      </Link>
      <div className="order-topline">
        <div>
          <span className="eyebrow">
            {admin ? "Order management" : "Your order"} · Placed {dateTime(o.created_at)}
          </span>
          <h1>{o.order_number}</h1>
        </div>
        <div className="order-badges">
          <Method value={o.payment_method} />
          <Badge value={o.payment_status} />
          <Badge value={o.order_status} />
          {/* A file download, not a page: the download attribute keeps the loading indicator out of it. */}
          <a
            className="button button-outline button-small"
            href={`/api/orders/${o.id}/invoice${guestToken ? `?token=${guestToken}` : ""}`}
            download
          >
            <Download size={15} /> Download bill
          </a>
        </div>
      </div>
      {created && (
        <div className="success-message">
          Your order is saved.{" "}
          {o.payment_method === "WHATSAPP"
            ? "Open WhatsApp below to send the order details and arrange payment."
            : o.payment_method === "COD"
              ? pickup
                ? "Pay in cash when you collect it from the store."
                : "Pay in cash when your furniture is delivered."
              : "Continue to PayHere below to complete your payment."}
        </div>
      )}
      {returned && o.payment_status !== "PAID" && (
        <div className="info-message">
          Your payment has not been confirmed yet. The status updates when PayHere sends its
          verified notification. You can refresh this page or return to your order history later.
        </div>
      )}
      {deadline && (
        <div className="info-message">
          <strong>Complete your payment by {dateTime(deadline)}.</strong> After that this order is
          cancelled automatically and the items go back on sale.
        </div>
      )}
      {estimate && (
        <div className="estimate-note">
          <CalendarClock size={18} />
          <span>
            Estimated delivery to {o.district}: <strong>{estimate}</strong>
          </span>
        </div>
      )}
      {o.order_status === "CANCELLED" ? (
        <div className="error-message">
          This order was cancelled on {dateTime(o.updated_at)}. Reserved stock has been released.
        </div>
      ) : (
        <OrderProgress status={o.order_status} pickup={pickup} />
      )}
      {!pickup && ["SHIPPED", "DELIVERED"].includes(o.order_status) && (
        <div className="tracking-card">
          <span className="tracking-icon">
            <Truck size={22} />
          </span>
          <div>
            <strong>
              {o.order_status === "DELIVERED" ? "Delivered" : "Your order is on its way"}
            </strong>
            {o.courier || o.tracking_number ? (
              <dl>
                {o.courier && (
                  <div>
                    <dt>Courier</dt>
                    <dd>{o.courier}</dd>
                  </div>
                )}
                {o.tracking_number && (
                  <div>
                    <dt>Tracking number</dt>
                    <dd className="tracking-number">{o.tracking_number}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p>
                {admin
                  ? "No tracking details have been added for this delivery."
                  : "Our delivery team will contact you on the phone number below."}
              </p>
            )}
          </div>
        </div>
      )}
      <div className="order-details">
        <div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Piece</th>
                  <th>Qty</th>
                  <th>Unit price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {o.order_items.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <strong>{i.product_name}</strong>
                      <small>{i.variant_details}</small>
                    </td>
                    <td>{i.quantity}</td>
                    <td>{money(i.unit_price)}</td>
                    <td>{money(i.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <OrderActions order={o} admin={admin} guestToken={guestToken} />
          <TrackingHistory events={events} pickup={pickup} />
          {windowDays !== undefined && (
            <ReturnPanel
              orderId={o.id}
              request={returnRequest}
              admin={admin}
              windowDays={windowDays}
              canRequest={!guestToken && o.order_status === "DELIVERED" && windowDays > 0}
            />
          )}
          {o.payment_method === "WHATSAPP" && (
            <details className="message-preview">
              <summary>
                {admin ? "WhatsApp message the customer sends" : "Preview your WhatsApp message"}
              </summary>
              <pre>{whatsappMessage(o)}</pre>
              <p>
                Opening WhatsApp only prepares this message. The order is confirmed when the store
                team reviews it; it is not an online payment.
              </p>
            </details>
          )}
          {admin && o.payment_method === "PAYHERE" && (
            <section className="payment-events">
              <h2>Payment notifications</h2>
              {payments.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Received</th>
                        <th>PayHere payment ID</th>
                        <th>Result</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <td>{dateTime(p.created_at)}</td>
                          <td>{p.payment_id}</td>
                          <td>{payhereStatus[p.status_code] || p.status_code}</td>
                          <td>{money(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="muted">No signature-verified notification has arrived yet.</p>
              )}
            </section>
          )}
        </div>
        <div>
          <aside className="order-summary">
            <h2>Order summary</h2>
            <div className="summary-line">
              <span>Subtotal</span>
              <span>{money(o.subtotal)}</span>
            </div>
            <div className="summary-line">
              <span>{pickup ? "Store pickup" : "Delivery"}</span>
              <span>{pickup ? "Free" : deliveryLabel(Number(o.delivery_fee))}</span>
            </div>
            {Number(o.bundle_discount) > 0 && (
              <div className="summary-line discount">
                <span>Set saving ({o.bundle_names})</span>
                <span>− {money(Number(o.bundle_discount))}</span>
              </div>
            )}
            {Number(o.discount_amount) > 0 && (
              <div className="summary-line discount">
                <span>Coupon {o.coupon_code}</span>
                <span>− {money(Number(o.discount_amount))}</span>
              </div>
            )}
            {Number(o.points_discount) > 0 && (
              <div className="summary-line discount">
                <span>{o.points_redeemed} reward points</span>
                <span>− {money(Number(o.points_discount))}</span>
              </div>
            )}
            <div className="summary-line total">
              <span>Total</span>
              <span>{money(o.total_amount)}</span>
            </div>
            <p className="summary-note">
              {o.payment_method === "PAYHERE"
                ? `PayHere${payhere().mode === "sandbox" ? " Sandbox" : ""} · payment ${label(o.payment_status)}`
                : o.payment_method === "COD"
                  ? `Cash ${pickup ? "at pickup" : "on delivery"} · payment ${label(o.payment_status)}`
                  : "WhatsApp · payment arranged with store"}
            </p>
          </aside>
          <section className="form-card detail-card">
            <h3>{pickup ? "Store pickup" : "Delivery details"}</h3>
            {pickup ? (
              <p>
                <strong>{o.customer_name}</strong>
                <br />
                Collecting on {o.pickup_at ? dateTime(o.pickup_at) : "a time to be confirmed"}
                {settings?.pickup_address && (
                  <>
                    <br />
                    {settings.pickup_address}
                  </>
                )}
              </p>
            ) : (
              <p>
                <strong>{o.customer_name}</strong>
                <br />
                {o.shipping_address}
                <br />
                {o.city}, {o.postal_code}
              </p>
            )}
            <p>
              {o.customer_phone}
              <br />
              {o.customer_email}
            </p>
            {admin && (
              <div className="contact-links">
                <a href={`tel:${o.customer_phone}`}>
                  <Phone size={14} /> Call
                </a>
                <a href={`mailto:${o.customer_email}?subject=Your order ${o.order_number}`}>
                  <Mail size={14} /> Email
                </a>
                <a href={`https://wa.me/94${local}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={14} /> WhatsApp
                </a>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

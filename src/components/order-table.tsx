import Link from "next/link";
import { Banknote, CreditCard, MessageCircle, Store } from "lucide-react";
import { money, label, dateOnly } from "@/lib/format";
import type { Order } from "@/types";
export function Badge({ value }: { value: string }) {
  return <span className={`status status-${value.toLowerCase()}`}>{label(value)}</span>;
}
export function Method({ value }: { value: Order["payment_method"] }) {
  return (
    <span className="method">
      {value === "PAYHERE" ? (
        <CreditCard size={14} />
      ) : value === "COD" ? (
        <Banknote size={14} />
      ) : (
        <MessageCircle size={14} />
      )}
      {value === "PAYHERE" ? "PayHere" : value === "COD" ? "Cash" : "WhatsApp"}
    </span>
  );
}
export function OrderTable({
  orders,
  admin = false,
  emptyText,
}: {
  orders: Order[];
  admin?: boolean;
  emptyText?: string;
}) {
  if (!orders.length)
    return (
      <div className="empty-state">
        <h2>No orders just yet.</h2>
        <p>
          {emptyText ||
            (admin
              ? "New customer orders will appear here."
              : "Your next favourite piece is waiting in the collection.")}
        </p>
        {!admin && (
          <Link className="button" href="/products">
            Explore the collection
          </Link>
        )}
      </div>
    );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order</th>
            {admin && <th>Customer</th>}
            <th>Placed</th>
            <th>Items</th>
            <th>Total</th>
            <th>Method</th>
            <th>Payment</th>
            <th>Status</th>
            <th>
              <span className="sr-only">Details</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <strong>{o.order_number}</strong>
                {o.requires_review && (
                  <small className="review-flag">Payment review required</small>
                )}
              </td>
              {admin && (
                <td>
                  {o.customer_name}
                  <small>{o.customer_phone}</small>
                </td>
              )}
              <td>{dateOnly(o.created_at)}</td>
              <td>
                {o.order_items.reduce((a, i) => a + i.quantity, 0)}
                {o.fulfillment_method === "PICKUP" && (
                  <small className="pickup-flag">
                    <Store size={12} /> Pickup
                  </small>
                )}
              </td>
              <td>{money(o.total_amount)}</td>
              <td>
                <Method value={o.payment_method} />
              </td>
              <td>
                <Badge value={o.payment_status} />
              </td>
              <td>
                <Badge value={o.order_status} />
              </td>
              <td>
                <Link href={`${admin ? "/admin" : ""}/orders/${o.id}`} className="text-link">
                  View order
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

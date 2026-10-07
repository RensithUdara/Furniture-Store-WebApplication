"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import { OrderTable } from "@/components/order-table";
import { label } from "@/lib/format";
import type { Order } from "@/types";
const tabs = ["ALL", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
export function OrderBrowser({ orders }: { orders: Order[] }) {
  const [status, setStatus] = useState("ALL"),
    [method, setMethod] = useState(""),
    [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const rows = orders.filter(
    (o) =>
      (status === "ALL" || o.order_status === status) &&
      (!method || (method === "REVIEW" ? o.requires_review : o.payment_method === method)) &&
      `${o.order_number} ${o.customer_name} ${o.customer_email} ${o.customer_phone}`
        .toLowerCase()
        .includes(q),
  );
  return (
    <>
      <div className="tabs" role="tablist" aria-label="Filter by order status">
        {tabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={status === t}
            className={status === t ? "active" : ""}
            onClick={() => setStatus(t)}
          >
            {label(t)}
            <span>{orders.filter((o) => t === "ALL" || o.order_status === t).length}</span>
          </button>
        ))}
      </div>
      <div className="catalog-tools">
        <div className="search-field">
          <Search size={18} />
          <input
            aria-label="Search orders"
            placeholder="Search order number, customer, phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <label className="sort-label">
          Show
          <select
            aria-label="Filter by payment"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="">All methods</option>
            <option value="PAYHERE">PayHere</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="COD">Cash on delivery</option>
            <option value="REVIEW">Needs payment review</option>
          </select>
        </label>
      </div>
      <OrderTable orders={rows} admin emptyText="No orders match these filters." />
    </>
  );
}

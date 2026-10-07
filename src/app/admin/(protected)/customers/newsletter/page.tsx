import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { guardAdminPage } from "@/lib/auth";
import { getSubscribers } from "@/services/marketing";
import { SubscriberList } from "@/components/admin/subscriber-list";
export const metadata = { title: "Newsletter subscribers" };
export default async function Newsletter() {
  if (!(await guardAdminPage("orders"))) return null;
  const subscribers = await getSubscribers();
  const active = subscribers?.filter((s) => !s.unsubscribed_at).length || 0;
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Sales</span>
          <h1>Newsletter subscribers</h1>
          <p>
            {subscribers
              ? `${active} subscribed${subscribers.length > active ? `, ${subscribers.length - active} unsubscribed` : ""}. `
              : ""}
            People who signed up at the bottom of the store. Download the list to send your
            newsletter from an email service; leave out anyone marked unsubscribed.
          </p>
        </div>
        <div className="admin-actions">
          <Link className="button button-outline" href="/admin/customers">
            <ArrowLeft size={16} /> Customers
          </Link>
          {subscribers && subscribers.length > 0 && (
            <a className="button" href="/api/newsletter">
              <Download size={16} /> Download CSV
            </a>
          )}
        </div>
      </div>
      {subscribers === null ? (
        <div className="info-message">The newsletter is not available yet.</div>
      ) : (
        <SubscriberList subscribers={subscribers} />
      )}
    </>
  );
}

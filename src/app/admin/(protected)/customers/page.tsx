import Link from "next/link";
import { Mail } from "lucide-react";
import { guardAdminPage } from "@/lib/auth";
import { getCustomers } from "@/services/admin";
import { CustomerList } from "@/components/admin/customer-list";
export const metadata = { title: "Customers" };
export default async function Customers() {
  if (!(await guardAdminPage("orders"))) return null;
  const customers = await getCustomers();
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Sales</span>
          <h1>Customers</h1>
          <p>
            Everyone with an account: what they have ordered and spent, and their reward points.
            Guest orders have no account and are not listed here.
          </p>
        </div>
        <Link className="button button-outline" href="/admin/customers/newsletter">
          <Mail size={16} /> Newsletter subscribers
        </Link>
      </div>
      {customers === null ? (
        <div className="info-message">The customer list is not available yet.</div>
      ) : (
        <CustomerList customers={customers} />
      )}
    </>
  );
}

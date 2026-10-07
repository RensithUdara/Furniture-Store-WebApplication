import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { guardAdminPage } from "@/lib/auth";
import { getBundles, getProducts } from "@/services/catalog";
import { BundleManager } from "@/components/admin/bundle-form";
export const metadata = { title: "Room sets" };
export default async function Sets() {
  if (!(await guardAdminPage("products"))) return null;
  const [bundles, products] = await Promise.all([getBundles(true), getProducts(true)]);
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Catalog</span>
          <h1>Room sets</h1>
          <p>
            Products that cost less when ordered together. The saving is applied automatically, once
            for every complete set in an order, and coupons apply to what is left.
          </p>
        </div>
        <Link className="button button-outline" href="/admin/products">
          <ArrowLeft size={16} /> Products
        </Link>
      </div>
      {bundles === null ? (
        <div className="info-message">Room sets are not available yet.</div>
      ) : (
        <BundleManager bundles={bundles} products={products} />
      )}
    </>
  );
}

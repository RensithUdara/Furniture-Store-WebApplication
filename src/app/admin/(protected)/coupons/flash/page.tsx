import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { guardAdminPage } from "@/lib/auth";
import { getProducts } from "@/services/catalog";
import { getFlashSales } from "@/services/marketing";
import { FlashManager } from "@/components/admin/flash-form";
export const metadata = { title: "Flash sales" };
export default async function FlashSales() {
  if (!(await guardAdminPage("coupons"))) return null;
  const [sales, products] = await Promise.all([getFlashSales(), getProducts(true)]);
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Promotions</span>
          <h1>Flash sales</h1>
          <p>
            A percentage off chosen products, or the whole store, between two moments. It starts and
            ends by itself, with a countdown for shoppers.
          </p>
        </div>
        <Link className="button button-outline" href="/admin/coupons">
          <ArrowLeft size={16} /> Coupons
        </Link>
      </div>
      {sales === null ? (
        <div className="info-message">Flash sales are not available yet.</div>
      ) : (
        <FlashManager sales={sales} products={products.filter((p) => p.is_active)} />
      )}
    </>
  );
}

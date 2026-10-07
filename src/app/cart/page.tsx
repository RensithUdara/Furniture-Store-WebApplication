import { PRIVATE } from "@/lib/seo";
import { CartPage } from "@/components/cart-page";
import { getSettings } from "@/services/settings";
import { getBundles } from "@/services/catalog";
export const metadata = { title: "Your shopping bag", robots: PRIVATE };
export default async function Page() {
  const [settings, bundles] = await Promise.all([getSettings(), getBundles()]);
  return <CartPage settings={settings} bundles={bundles || []} />;
}

import { CartPage } from "@/components/cart-page";
import { getSettings } from "@/services/settings";
export const metadata = { title: "Your shopping bag" };
export default async function Page() {
  return <CartPage settings={await getSettings()} />;
}

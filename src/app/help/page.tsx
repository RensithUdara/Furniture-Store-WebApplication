import { pageMeta } from "@/lib/seo";
import { InfoPage } from "@/components/info-page";
import { payhere } from "@/lib/config";
import { getSettings } from "@/services/settings";
import { money } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata = pageMeta({
  title: "Delivery, care & ordering",
  description:
    "How delivery and store pickup work at Forma & Co., how to place an order, and how to care for timber, fabric and leather furniture.",
  path: "/help",
});
export default async function Help() {
  const settings = await getSettings();
  return (
    <InfoPage current="/help" eyebrow="Here to help" title="Delivery, care and ordering">
      <section>
        <h2>Delivery, made simple.</h2>
        <p>
          Delivery is available across Sri Lanka.{" "}
          {settings &&
            `Orders of ${money(settings.free_delivery_from)} or more qualify for complimentary delivery; other orders have a flat delivery fee of ${money(settings.delivery_fee)}. `}
          The store team confirms timing and access arrangements after reviewing your order.
        </p>
        <p>
          Please provide a complete street address and a reachable Sri Lankan phone number. Check
          doorways, stairs, and the dimensions of your chosen piece before ordering.
        </p>
      </section>
      <section id="payments">
        <h2>Your preferred way to order.</h2>
        <p>
          {payhere().mode === "sandbox"
            ? "PayHere checkout currently runs in the Sandbox environment, so these are test payments. "
            : "Online payments are processed securely by PayHere. "}
          Orders are marked paid only after a verified payment notification.
        </p>
        <p>
          With WhatsApp ordering, your order is saved first. The WhatsApp button prepares a message
          with your pieces, quantities, totals, and delivery details. Send that message to arrange
          payment with the store. Opening the message does not count as payment.
        </p>
      </section>
      <section>
        <h2>A little care goes a long way.</h2>
        <p>
          Use a soft, dry cloth for everyday dusting. Blot spills promptly without rubbing. Avoid
          prolonged direct sunlight, excess moisture, abrasive cleaners, and placing hot items
          directly on timber. Follow the care information provided with your furniture.
        </p>
      </section>
      <section id="returns">
        <h2>Changed your mind?</h2>
        <p>
          You can cancel a pending, unpaid order from your order page. For paid or confirmed orders,
          contact the store through your existing order conversation. Paid cancellations require the
          store team to review the payment and arrange any refund separately.
        </p>
      </section>
    </InfoPage>
  );
}

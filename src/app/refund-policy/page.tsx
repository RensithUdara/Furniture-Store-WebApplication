import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";
export const metadata = pageMeta({
  title: "Refund policy",
  description:
    "When and how you can return furniture bought from Forma & Co., and how refunds are paid.",
  path: "/refund-policy",
});
export default function RefundPolicy() {
  return (
    <InfoPage
      current="/refund-policy"
      eyebrow="Policies"
      title="Refund policy"
      intro="Cancellations, returns, and how refunds are paid."
    >
      <section>
        <h2>Cancelling before dispatch</h2>
        <p>
          You can cancel a pending, unpaid order yourself from its order page; the reserved stock is
          released immediately. If you have already paid online, contact us with your order number.
          Paid cancellations are reviewed by our team and refunded in full when the order has not
          been dispatched.
        </p>
      </section>
      <section>
        <h2>Returns after delivery</h2>
        <p>
          Tell us within 7 days of delivery or pickup if a piece arrives damaged, faulty, or is not
          what you ordered. Send your order number and photographs. We will arrange a repair, a
          replacement, or a refund.
        </p>
        <p>
          Change-of-mind returns are accepted within 7 days when the furniture is unused, in its
          original condition, and has its packaging. The return delivery cost is the customer&apos;s
          responsibility.
        </p>
      </section>
      <section>
        <h2>How refunds are paid</h2>
        <ul>
          <li>PayHere payments are refunded to the original card or account.</li>
          <li>Cash on delivery and WhatsApp orders are refunded by bank transfer.</li>
          <li>Refunds are processed within 7 to 10 working days of approval.</li>
        </ul>
        <p>
          Refunds are never issued automatically by the website. Each one is checked against the
          payment record first, which protects you and the store from mistakes.
        </p>
      </section>
      <section>
        <h2>Faults after the return period</h2>
        <p>
          Defects that appear later may be covered by the{" "}
          <Link href="/warranty">warranty policy</Link>.
        </p>
      </section>
    </InfoPage>
  );
}

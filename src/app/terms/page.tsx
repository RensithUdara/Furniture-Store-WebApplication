import Link from "next/link";
import { InfoPage } from "@/components/info-page";
export const metadata = { title: "Terms of use" };
export default function Terms() {
  return (
    <InfoPage
      current="/terms"
      eyebrow="Policies"
      title="Terms of use"
      intro="The rules for using this website and buying from Forma & Co."
    >
      <section>
        <h2>Using this website</h2>
        <p>
          By using this website or placing an order you agree to these terms. You must give accurate
          contact and delivery details and keep your account password private. You are responsible
          for activity on your account.
        </p>
      </section>
      <section>
        <h2>Products and prices</h2>
        <p>
          All prices are in Sri Lankan rupees (LKR). We take care to show colours, dimensions, and
          stock accurately, but natural materials vary and screens differ. The price and
          availability that apply are the ones confirmed by our system when your order is saved.
        </p>
      </section>
      <section>
        <h2>Orders and payment</h2>
        <p>
          An order is accepted when we confirm it. Online payments are handled by PayHere; this
          website never sees or stores your card details. An online order is treated as paid only
          after a verified payment notification. Cash on delivery and WhatsApp orders are confirmed
          by our team.
        </p>
        <p>
          We may cancel an order if a product is unavailable, a price was shown in error, or a
          payment cannot be verified. Any amount already paid is refunded under the{" "}
          <Link href="/refund-policy">refund policy</Link>.
        </p>
      </section>
      <section>
        <h2>Delivery and pickup</h2>
        <p>
          Delivery is available within Sri Lanka. Delivery dates are estimates. For store pickup,
          please arrive at the time you selected and bring your order number.
        </p>
      </section>
      <section>
        <h2>Your information</h2>
        <p>
          We use your name, contact details, and address only to process orders, deliver furniture,
          and support you afterwards. Passwords are stored as secure hashes by our authentication
          provider and are never visible to us.
        </p>
      </section>
      <section>
        <h2>Warranty and liability</h2>
        <p>
          Furniture is covered by the <Link href="/warranty">warranty policy</Link>. To the extent
          the law allows, our liability for any order is limited to the amount paid for it.
        </p>
      </section>
      <section>
        <h2>Changes</h2>
        <p>
          We may update these terms. The version published on this page applies to orders placed
          after it changes. These terms are governed by the laws of Sri Lanka.
        </p>
      </section>
    </InfoPage>
  );
}

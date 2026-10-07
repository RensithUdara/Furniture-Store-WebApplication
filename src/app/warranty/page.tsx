import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";
export const metadata = pageMeta({
  title: "Warranty policy",
  description:
    "What the Forma & Co. furniture warranty covers, how long it lasts, and how to make a claim.",
  path: "/warranty",
});
export default function Warranty() {
  return (
    <InfoPage
      current="/warranty"
      eyebrow="Policies"
      title="Warranty policy"
      intro="What is covered, what is not, and how to make a claim."
    >
      <section>
        <h2>What is covered</h2>
        <p>
          Furniture bought from Forma & Co. is covered for 12 months from the delivery or pickup
          date against manufacturing defects in materials and workmanship under normal household
          use. This includes structural faults in frames and joints, faulty mechanisms, and
          defective stitching or seams.
        </p>
      </section>
      <section>
        <h2>What is not covered</h2>
        <ul>
          <li>
            Normal wear, fading from sunlight, and natural variation in timber grain or colour.
          </li>
          <li>
            Damage from misuse, accidents, moisture, heat, pests, or unsuitable cleaning products.
          </li>
          <li>Furniture that has been altered or repaired by someone other than our team.</li>
          <li>Commercial or outdoor use of pieces designed for use inside the home.</li>
        </ul>
      </section>
      <section>
        <h2>How to make a claim</h2>
        <ol>
          <li>Find the order number in your order history.</li>
          <li>Contact us with the order number, a short description, and clear photographs.</li>
          <li>We assess the claim and, where it is covered, repair or replace the item.</li>
        </ol>
        <p>
          If an identical replacement is not available, we will offer a comparable piece or a refund
          under the <Link href="/refund-policy">refund policy</Link>.
        </p>
      </section>
      <section>
        <h2>Looking after your furniture</h2>
        <p>
          Following the guidance in <Link href="/help">Delivery & care</Link> keeps your furniture
          in good condition and your warranty valid.
        </p>
      </section>
    </InfoPage>
  );
}

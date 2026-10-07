import { jsonLd, pageMeta } from "@/lib/seo";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";
import { getSettings } from "@/services/settings";
import { money } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata = pageMeta({
  title: "Frequently asked questions",
  description:
    "Answers about ordering furniture from Forma & Co.: payment by PayHere, cash on delivery or WhatsApp, delivery across Sri Lanka, store pickup, returns and warranty.",
  path: "/faq",
});
export default async function Faq() {
  const s = await getSettings();
  const hours =
    s?.pickup_open_hour != null ? `${s.pickup_open_hour}:00 to ${s.pickup_close_hour}:00` : null;
  const groups = [
    {
      title: "Ordering",
      items: [
        [
          "Do I need an account to order?",
          "No. You can check out as a guest and follow your order with a private link or the Track order page. An account adds saved addresses, coupons, reward points, reviews and your full order history.",
        ],
        [
          "How do I choose a colour or finish?",
          "Open the product page and pick a finish. Each finish has its own price and stock level. The Add to cart button on a product card uses the first finish that is in stock.",
        ],
        [
          "Is the item reserved when I order?",
          "Yes. Stock is reserved the moment your order is saved, so nobody else can buy the same piece while you pay. If you cancel, the stock is released again.",
        ],
        [
          "Can I change or cancel my order?",
          "You can cancel a pending, unpaid order from its order page. For anything else, contact us with your order number and we will help.",
        ],
      ],
    },
    {
      title: "Payment",
      items: [
        [
          "Which payment methods do you accept?",
          "Card and bank payments through PayHere, cash on delivery (or cash at the store for pickup orders), and orders arranged over WhatsApp.",
        ],
        [
          "When is my online payment confirmed?",
          "Only after PayHere sends us a verified payment notification. Returning to the website from the payment page does not, by itself, mark an order as paid.",
        ],
        [
          "How does a WhatsApp order work?",
          "We save your order first, then open WhatsApp with a ready-made message listing every item, quantity, total, and your details. Send it and our team will confirm payment and delivery with you.",
        ],
        [
          "How does cash on delivery work?",
          "Place the order, and pay the full amount in cash when your furniture is delivered or when you collect it from the store.",
        ],
      ],
    },
    {
      title: "Delivery and pickup",
      items: [
        [
          "How much is delivery?",
          s
            ? `Delivery is ${money(s.delivery_fee)} anywhere in Sri Lanka, and free for orders of ${money(s.free_delivery_from)} or more. Store pickup is always free.`
            : "The delivery fee is shown at checkout before you place the order. Store pickup is always free.",
        ],
        [
          "Can I collect my order from the store?",
          hours
            ? `Yes. Choose Store pickup at checkout and pick a date and time between ${hours}. ${s?.pickup_address ? `Pickup address: ${s.pickup_address}.` : ""}`
            : "Yes. Choose Store pickup at checkout and pick a date and time that suits you.",
        ],
        [
          "How do I track my order?",
          "Open Order history in your account. Each order shows its progress from placed to delivered or collected.",
        ],
      ],
    },
  ];
  return (
    <InfoPage
      current="/faq"
      eyebrow="Help centre"
      title="Frequently asked questions"
      intro="Quick answers about ordering, paying, delivery, and pickup."
    >
      {/* Lets search engines show the questions and answers directly in results. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: groups.flatMap((g) =>
              g.items.flatMap(([q, a]) =>
                typeof q === "string" && typeof a === "string"
                  ? [
                      {
                        "@type": "Question",
                        name: q,
                        acceptedAnswer: { "@type": "Answer", text: a },
                      },
                    ]
                  : [],
              ),
            ),
          }),
        }}
      />
      {groups.map((g) => (
        <section key={g.title}>
          <h2>{g.title}</h2>
          {g.items.map(([q, a]) => (
            <details key={q} className="faq-item">
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
      ))}
      <section>
        <h2>Still have a question?</h2>
        <p>
          See <Link href="/help">Delivery & care</Link>, the{" "}
          <Link href="/warranty">warranty policy</Link>, or the{" "}
          <Link href="/refund-policy">refund policy</Link>.
        </p>
      </section>
    </InfoPage>
  );
}

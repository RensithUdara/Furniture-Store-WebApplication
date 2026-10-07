import Link from "next/link";
const pages = [
  { href: "/faq", name: "FAQ" },
  { href: "/help", name: "Delivery & care" },
  { href: "/warranty", name: "Warranty policy" },
  { href: "/refund-policy", name: "Refund policy" },
  { href: "/terms", name: "Terms of use" },
];
// Shared layout for the customer-care and policy pages.
export function InfoPage({
  current,
  eyebrow,
  title,
  intro,
  children,
}: {
  current: string;
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container page-space info-layout">
      <nav className="info-nav" aria-label="Customer care">
        <span className="eyebrow">Customer care</span>
        {pages.map((p) => (
          <Link key={p.href} href={p.href} className={p.href === current ? "active" : ""}>
            {p.name}
          </Link>
        ))}
      </nav>
      <article className="info-content">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {intro && <p className="info-intro">{intro}</p>}
        {children}
      </article>
    </div>
  );
}

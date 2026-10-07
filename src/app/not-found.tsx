import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-state page-space">
      <span className="eyebrow">404 · A little out of place</span>
      <h1>We couldn’t find that page.</h1>
      <p>There’s still plenty to discover in the collection.</p>
      <Link href="/products" className="button">
        Explore the collection
      </Link>
    </div>
  );
}

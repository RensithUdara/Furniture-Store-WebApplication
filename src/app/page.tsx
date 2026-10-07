import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CreditCard,
  Hammer,
  MessageCircle,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";
import { getCategories, getProducts, getShopBundles } from "@/services/catalog";
import { BundleCard } from "@/components/bundle-card";
import { getSettings } from "@/services/settings";
import { getSlides } from "@/services/slides";
import { ProductCard } from "@/components/product-card";
import { Carousel } from "@/components/carousel";
import { money } from "@/lib/format";
import type { StoreSettings } from "@/types";
export const dynamic = "force-dynamic";
const reasons = (settings: StoreSettings | null) => [
  {
    icon: Hammer,
    title: "Built to last",
    text: "Solid timber frames and hard-wearing fabrics chosen for everyday family life.",
  },
  {
    icon: Truck,
    title: "Islandwide delivery",
    text: settings
      ? `Flat ${money(settings.delivery_fee)} delivery, and free on orders of ${money(settings.free_delivery_from)} or more.`
      : "Delivered to your door anywhere in Sri Lanka.",
  },
  {
    icon: ShieldCheck,
    title: "Secure checkout",
    text: "Pay online through PayHere. Orders are confirmed only after a verified payment.",
  },
  {
    icon: MessageCircle,
    title: "Order on WhatsApp",
    text: "Prefer to talk it through? Send your full cart to our team in one tap.",
  },
];
export default async function Home() {
  const [categories, products, settings, slides] = await Promise.all([
    getCategories(),
    getProducts(),
    getSettings(),
    getSlides(),
  ]);
  const sets = (await getShopBundles(products)).slice(0, 2);
  const parents = categories.filter((c) => !c.parent_id);
  const featured = products.filter((p) => p.is_featured).slice(0, 4);
  const arrivals = products.filter((p) => !featured.includes(p)).slice(0, 8);
  return (
    <>
      <h1 className="sr-only">Forma & Co. furniture store</h1>
      {slides.length ? (
        <Carousel slides={slides} />
      ) : (
        <section className="banner">
          <div className="container">
            <span className="eyebrow">Furniture store</span>
            <h2>Furniture for a life well lived.</h2>
            <Link href="/products" className="button">
              Shop all furniture <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      )}
      <div className="container">
        <div className="benefit-strip">
          <span>
            <Truck size={22} /> Islandwide delivery
          </span>
          <span>
            <CreditCard size={22} /> Secure PayHere checkout
          </span>
          <span>
            <Banknote size={22} /> Cash on delivery
          </span>
          <span>
            <Store size={22} /> Store pickup
          </span>
          <span>
            <MessageCircle size={22} /> Order on WhatsApp
          </span>
        </div>
      </div>
      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Shop by category</span>
            <h2>A place for every piece</h2>
          </div>
          <Link className="text-link" href="/products">
            Shop all furniture <ArrowRight size={17} />
          </Link>
        </div>
        <div className="category-grid">
          {parents.map((c) => (
            <Link href={`/products?category=${c.slug}`} className="category-card" key={c.id}>
              <div>
                <img src={c.image_url || "/images/living.jpg"} alt="" loading="lazy" />
              </div>
              <h3>{c.name}</h3>
              {c.description && <p>{c.description}</p>}
            </Link>
          ))}
        </div>
      </section>
      {featured.length > 0 && (
        <section className="section featured-section">
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Customer favourites</span>
                <h2>Bestsellers</h2>
              </div>
              <Link className="text-link" href="/products">
                View the collection <ArrowRight size={17} />
              </Link>
            </div>
            <div className="product-grid">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
      {arrivals.length > 0 && (
        <section className="section container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Just in</span>
              <h2>New arrivals</h2>
            </div>
            <Link className="text-link" href="/products?sort=newest">
              Explore new arrivals <ArrowRight size={17} />
            </Link>
          </div>
          <div className="product-grid">
            {arrivals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
      {sets.length > 0 && (
        <section className="section container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Complete the room</span>
              <h2>Room sets</h2>
            </div>
            <Link className="text-link" href="/bundles">
              See every set <ArrowRight size={17} />
            </Link>
          </div>
          <div className="bundle-list">
            {sets.map((b) => (
              <BundleCard
                key={b.id}
                bundle={b}
                products={b.product_ids.flatMap((id) => products.find((p) => p.id === id) || [])}
              />
            ))}
          </div>
        </section>
      )}
      <section className="section container" id="our-story">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Why Forma & Co.</span>
            <h2>Made easy, start to finish</h2>
          </div>
        </div>
        <div className="reason-grid">
          {reasons(settings).map(({ icon: Icon, title, text }) => (
            <div className="reason-card" key={title}>
              <span>
                <Icon size={22} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="container">
        <div className="closing-cta">
          <div>
            <h2>Need help choosing?</h2>
            <p>Read the answers to common questions, or message the team on WhatsApp.</p>
          </div>
          <div className="closing-actions">
            <Link href="/faq" className="button button-light">
              Read the FAQ
            </Link>
            <Link href="/products" className="button">
              Shop all furniture <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

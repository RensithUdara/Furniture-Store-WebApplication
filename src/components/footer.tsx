"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp, Clock, MapPin, MessageCircle, Phone } from "lucide-react";
import { useStore, whatsappLink } from "@/components/store-provider";
import { phoneNumbers } from "@/lib/format";
import type { Category } from "@/types";
const hour = (h: number) => `${((h + 11) % 12) + 1}:00 ${h % 24 < 12 ? "am" : "pm"}`;
export function Footer({ categories }: { categories: Category[] }) {
  const path = usePathname();
  const { whatsapp, settings } = useStore();
  if (path.startsWith("/admin")) return null;
  const phones = phoneNumbers(settings?.store_phone);
  const address = settings?.pickup_address;
  const open = settings?.pickup_open_hour,
    close = settings?.pickup_close_hour;
  return (
    <>
      <footer className="footer">
        {/* Contact details come from Admin → Settings; each block appears only when it is filled in. */}
        {(address || phones.length > 0 || whatsapp) && (
          <div className="container footer-contact">
            {address && (
              <div>
                <span className="footer-icon">
                  <MapPin size={20} />
                </span>
                <div>
                  <h3>Visit our showroom</h3>
                  <p>{address}</p>
                </div>
              </div>
            )}
            {phones.length > 0 && (
              <div>
                <span className="footer-icon">
                  <Phone size={20} />
                </span>
                <div>
                  <h3>Call us</h3>
                  <p>
                    {phones.map((p, i) => (
                      <span key={p.tel}>
                        {i > 0 && " / "}
                        <a href={`tel:${p.tel}`}>{p.text}</a>
                      </span>
                    ))}
                  </p>
                </div>
              </div>
            )}
            {whatsapp && (
              <div>
                <span className="footer-icon">
                  <MessageCircle size={20} />
                </span>
                <div>
                  <h3>Chat on WhatsApp</h3>
                  <p>
                    <a
                      href={whatsappLink(whatsapp, "Hello Forma & Co., I have a question.")}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      +{whatsapp}
                    </a>
                  </p>
                </div>
              </div>
            )}
            {open != null && close != null && (
              <div>
                <span className="footer-icon">
                  <Clock size={20} />
                </span>
                <div>
                  <h3>Store pickup hours</h3>
                  <p>
                    {hour(open)} – {hour(close)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="container footer-grid">
          <div className="footer-brand">
            <Link className="wordmark" href="/">
              forma<span>& co.</span>
            </Link>
            <p>
              Considered furniture for the way you live. Built on solid timber frames and delivered
              across Sri Lanka.
            </p>
          </div>
          <nav aria-label="Shop">
            <h3>Shop</h3>
            <Link href="/products">All furniture</Link>
            {categories
              .filter((c) => !c.parent_id)
              .slice(0, 6)
              .map((c) => (
                <Link key={c.id} href={`/products?category=${c.slug}`}>
                  {c.name}
                </Link>
              ))}
          </nav>
          <nav aria-label="Your account">
            <h3>Your account</h3>
            <Link href="/account">My account</Link>
            <Link href="/account/orders">Order history</Link>
            <Link href="/account/wishlist">Wishlist</Link>
            <Link href="/account/rewards">Reward points</Link>
            <Link href="/cart">Cart</Link>
          </nav>
          <nav aria-label="Customer care">
            <h3>Customer care</h3>
            <Link href="/track">Track your order</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/help">Delivery & care</Link>
            <Link href="/warranty">Warranty policy</Link>
            <Link href="/refund-policy">Refund policy</Link>
            <Link href="/terms">Terms of use</Link>
          </nav>
        </div>
        <div className="footer-bar">
          <div className="container">
            <span>
              © {new Date().getFullYear()} Forma & Co. All rights reserved. Prices in LKR.
            </span>
            <span className="footer-bar-links">
              <Link href="/terms">Terms</Link>
              <Link href="/refund-policy">Refunds</Link>
              <Link href="/admin">Store admin</Link>
              <a href="#main" className="footer-top">
                Back to top <ArrowUp size={14} />
              </a>
            </span>
          </div>
        </div>
      </footer>
      {whatsapp && (
        <a
          className="whatsapp-fab"
          href={whatsappLink(whatsapp, "Hello Forma & Co., I have a question.")}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
        >
          <MessageCircle size={26} />
        </a>
      )}
    </>
  );
}

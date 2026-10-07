import type { Metadata } from "next";
import { Suspense } from "react";
import { Poppins } from "next/font/google";
import { CartProvider } from "@/components/cart-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { currentUser } from "@/lib/auth";
import { isConfigured, whatsappNumber } from "@/lib/config";
import { isStaff } from "@/lib/permissions";
import { ConfirmProvider } from "@/components/dialogs";
import { StoreProvider } from "@/components/store-provider";
import { NavigationProgress } from "@/components/navigation-progress";
import { getCategories } from "@/services/catalog";
import { getSettings } from "@/services/settings";
import { getWishlistIds } from "@/services/rewards";
import { WishlistProvider } from "@/components/wishlist-provider";
import { CompareProvider } from "@/components/shop-extras";
import { SHARE_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, siteUrl } from "@/lib/seo";
import "./reset.css";
import "./globals.css";
import "./theme.css";
// The header shows the signed-in user, so no page may be prerendered with a stale session.
export const dynamic = "force-dynamic";
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});
// A function, so the site address is read when a page is served and not fixed at build time.
// Pages add their own title, description and canonical address; these are the defaults.
export function generateMetadata(): Metadata {
  const google = process.env.GOOGLE_SITE_VERIFICATION,
    bing = process.env.BING_SITE_VERIFICATION;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${SITE_NAME} — ${SITE_TAGLINE}`, template: `%s | ${SITE_NAME}` },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    category: "shopping",
    keywords: [
      "furniture Sri Lanka",
      "buy furniture online",
      "sofas",
      "beds",
      "dining tables",
      "chairs",
      "office desks",
      "storage furniture",
      "Hikkaduwa furniture store",
      "Forma & Co.",
    ],
    // Phone numbers and addresses in the page are already links where they should be.
    formatDetection: { telephone: false, address: false, email: false },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_LK",
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: SITE_DESCRIPTION,
      images: [SHARE_IMAGE],
    },
    twitter: { card: "summary_large_image", images: [SHARE_IMAGE.url] },
    // Proof of ownership for Google Search Console and Bing Webmaster Tools, when set.
    ...(google || bing
      ? {
          verification: {
            ...(google ? { google } : {}),
            ...(bing ? { other: { "msvalidate.01": bing } } : {}),
          },
        }
      : {}),
  };
}
export const viewport = { themeColor: "#16213e" };
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const fonts = poppins.variable;
  // All content is database-driven, so without a database there is nothing to show.
  if (!isConfigured())
    return (
      <html lang="en" className={fonts}>
        <body>
          <main id="main" className="admin-setup">
            <span className="eyebrow">Setup required</span>
            <h1>Connect the store database.</h1>
            <p>
              Add your Supabase URL and keys to <code>.env.local</code>, run the SQL files in{" "}
              <code>supabase/</code>, then restart the server. The README lists every step.
            </p>
          </main>
        </body>
      </html>
    );
  // Navigation data. A failure here must not take the whole page down with it; each page
  // reports its own data errors through the error boundary.
  const [user, categories, settings, wishlist] = await Promise.all([
    currentUser().catch(() => null),
    getCategories().catch(() => []),
    getSettings().catch(() => null),
    getWishlistIds().catch(() => null),
  ]);
  return (
    <html lang="en" className={fonts}>
      <body>
        <Suspense>
          <NavigationProgress />
        </Suspense>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <ConfirmProvider>
          <StoreProvider value={{ whatsapp: whatsappNumber(), settings }}>
            <CartProvider
              // Signed-in customers' bags are also kept on the server (migration 014).
              sync={Boolean(user) && settings?.cart_reminder_hours !== undefined}
            >
              <WishlistProvider initial={wishlist} signedIn={Boolean(user)}>
                <CompareProvider>
                  <Header
                    categories={categories}
                    // Only personalises navigation. Every protected page and API re-checks on the server.
                    user={
                      user
                        ? {
                            name: user.profile?.name || user.email || "",
                            admin: isStaff(user.profile),
                          }
                        : null
                    }
                  />
                  <main id="main">{children}</main>
                  <Footer categories={categories} />
                </CompareProvider>
              </WishlistProvider>
            </CartProvider>
          </StoreProvider>
        </ConfirmProvider>
      </body>
    </html>
  );
}

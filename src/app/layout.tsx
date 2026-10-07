import type { Metadata } from "next";
import { Suspense } from "react";
import { Poppins } from "next/font/google";
import { CartProvider } from "@/components/cart-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { currentUser } from "@/lib/auth";
import { isConfigured, whatsappNumber } from "@/lib/config";
import { StoreProvider } from "@/components/store-provider";
import { NavigationProgress } from "@/components/navigation-progress";
import { getCategories } from "@/services/catalog";
import { getSettings } from "@/services/settings";
import { getWishlistIds } from "@/services/rewards";
import { WishlistProvider } from "@/components/wishlist-provider";
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
export const metadata: Metadata = {
  title: { default: "Forma & Co. — Furniture for a life well lived", template: "%s | Forma & Co." },
  description:
    "Thoughtfully selected furniture for modern homes and workspaces. Explore sofas, chairs, tables, beds, and more at Forma & Co.",
};
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
        <StoreProvider value={{ whatsapp: whatsappNumber(), settings }}>
          <CartProvider>
            <WishlistProvider initial={wishlist} signedIn={Boolean(user)}>
              <Header
                categories={categories}
                // Only personalises navigation. Every protected page and API re-checks on the server.
                user={
                  user
                    ? {
                        name: user.profile?.name || user.email || "",
                        admin: user.profile?.role === "ADMIN",
                      }
                    : null
                }
              />
              <main id="main">{children}</main>
              <Footer categories={categories} />
            </WishlistProvider>
          </CartProvider>
        </StoreProvider>
      </body>
    </html>
  );
}

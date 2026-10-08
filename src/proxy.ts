import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isConfigured, supabaseKey, supabaseUrl } from "@/lib/config";
import { catalogVersion } from "@/lib/catalog-cache";

// Whether a product or category address exists. Pages start streaming before they can
// answer "not found", which would reach browsers and search engines as a 200. Checking here,
// before rendering starts, lets a wrong address answer with a real 404.
// The known addresses are kept for a minute; one that is not among them is looked up directly
// before it is refused, so a product added a moment ago is never turned away.
const known = globalThis as unknown as {
  __formaSlugs?: { at: number; version: number; products: Set<string>; categories: Set<string> };
};
async function exists(kind: "products" | "categories", slug: string) {
  const db = createClient(supabaseUrl(), supabaseKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let hit = known.__formaSlugs;
  if (!hit || hit.version !== catalogVersion() || Date.now() - hit.at > 60_000) {
    const [products, categories] = await Promise.all([
      db.from("products").select("slug").eq("is_active", true),
      db.from("categories").select("slug").eq("is_active", true),
    ]);
    // A database problem must never turn real pages into "not found".
    if (products.error || categories.error) return true;
    hit = known.__formaSlugs = {
      at: Date.now(),
      version: catalogVersion(),
      products: new Set(products.data.map((r) => r.slug)),
      categories: new Set(categories.data.map((r) => r.slug)),
    };
  }
  if (hit[kind].has(slug)) return true;
  const { data, error } = await db
    .from(kind)
    .select("slug")
    .eq("slug", slug)
    .eq("is_active", true)
    .limit(1);
  return Boolean(error) || Boolean(data?.length);
}

export async function proxy(request: NextRequest) {
  // Categories live at /category/[slug]. Old links with ?category= are redirected here, before
  // any page starts rendering, so browsers and search engines get a real permanent redirect.
  const slug = request.nextUrl.searchParams.get("category");
  if (request.nextUrl.pathname === "/products" && slug && /^[a-z0-9-]+$/.test(slug)) {
    const url = request.nextUrl.clone();
    url.pathname = `/category/${slug}`;
    url.searchParams.delete("category");
    return NextResponse.redirect(url, 308);
  }
  let response = NextResponse.next({ request });
  if (!isConfigured()) return response;
  const page = request.nextUrl.pathname.match(/^\/(category|products)\/([^/]+)$/);
  // Products can also be opened by id; those are left to the page.
  const byId = page?.[1] === "products" && /^[0-9a-f-]{36}$/.test(page[2]);
  if (page && !byId) {
    const valid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page[2]);
    if (!valid || !(await exists(page[1] === "category" ? "categories" : "products", page[2])))
      // No route has this address, so Next.js answers with its not-found page and a 404 status.
      return NextResponse.rewrite(new URL("/_missing", request.url));
  }
  // Without a Supabase session cookie there is no session to verify or refresh, so visitors
  // who are not signed in (and search engines) skip the round trip to the auth server.
  if (!request.cookies.getAll().some((c) => /^sb-.*-auth-token/.test(c.name))) return response;
  const client = createServerClient(supabaseUrl(), supabaseKey(), {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await client.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|api/payments/notification).*)"],
};

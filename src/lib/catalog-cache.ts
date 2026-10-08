// When the public catalogue was last made stale. Every state-changing API call bumps it (see
// checkOrigin in lib/http.ts), so the shared copy in services/catalog.ts is thrown away the
// moment anything is added, edited, ordered or restocked through the app.
// Kept on globalThis because pages and API routes can be bundled as separate module copies.
const store = globalThis as unknown as { __formaCatalogVersion?: number };
export const catalogVersion = () => store.__formaCatalogVersion || 0;
export const bumpCatalog = () => {
  store.__formaCatalogVersion = catalogVersion() + 1;
};

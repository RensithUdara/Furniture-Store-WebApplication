// The admin areas a staff role can be granted. The same names are enforced by the database
// (staff_roles.permissions and the has_permission() function in migration 007).
export const AREAS = [
  {
    key: "dashboard",
    name: "Dashboard",
    href: "/admin/dashboard",
    about: "See sales totals, order counts and low stock.",
  },
  {
    key: "orders",
    name: "Orders",
    href: "/admin/orders",
    about: "View every order, update its status, cancel it, and see payment notifications.",
  },
  {
    key: "products",
    name: "Products",
    href: "/admin/products",
    about: "Create, edit, show and hide products, their images, finishes and prices.",
  },
  {
    key: "categories",
    name: "Categories",
    href: "/admin/categories",
    about: "Create and edit categories and sub-categories.",
  },
  {
    key: "inventory",
    name: "Inventory",
    href: "/admin/inventory",
    about: "Change stock levels.",
  },
  {
    key: "promos",
    name: "Promo slides",
    href: "/admin/promos",
    about: "Manage the home page carousel.",
  },
  {
    key: "coupons",
    name: "Coupons",
    href: "/admin/coupons",
    about: "Create and edit discount codes.",
  },
  {
    key: "settings",
    name: "Settings",
    href: "/admin/settings",
    about: "Change delivery pricing, contact details, pickup hours and reward points.",
  },
] as const;
export type Area = (typeof AREAS)[number]["key"];
export const AREA_KEYS = AREAS.map((a) => a.key) as [Area, ...Area[]];

type Access = {
  role?: string | null;
  staff_roles?: { permissions?: string[] | null } | null;
} | null;

// An ADMIN may use every area. A STAFF account may use the areas its role lists.
export const isStaff = (profile: Access | undefined) =>
  profile?.role === "ADMIN" || profile?.role === "STAFF";
export const can = (profile: Access | undefined, area: Area) =>
  profile?.role === "ADMIN" ||
  (profile?.role === "STAFF" && Boolean(profile.staff_roles?.permissions?.includes(area)));
export const allowedAreas = (profile: Access | undefined) =>
  AREAS.filter((a) => can(profile, a.key)).map((a) => a.key);
// Where a staff member lands in the admin panel: the first area they are allowed to use.
export const homeFor = (profile: Access | undefined) =>
  AREAS.find((a) => can(profile, a.key))?.href || null;

<p align="center">
  <img src="public/images/forma-logo.png" alt="Forma & Co. — furniture and home" width="720" />
</p>

<h1 align="center">🛋️ Forma & Co.</h1>

<p align="center">
  <strong>Thoughtful furniture. A connected shopping experience.</strong><br />
  A furniture storefront and store management application built for Sri Lanka.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3.8-000000?style=for-the-badge&amp;logo=nextdotjs&amp;logoColor=white" alt="Next.js 16.3.8" />
  <img src="https://img.shields.io/badge/React-19.3.0-149ECA?style=for-the-badge&amp;logo=react&amp;logoColor=white" alt="React 19.3.0" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&amp;logo=typescript&amp;logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-173C31?style=for-the-badge&amp;logo=supabase&amp;logoColor=3ECF8E" alt="Supabase" />
  <img src="https://img.shields.io/badge/Node.js-22%2B-417E38?style=for-the-badge&amp;logo=nodedotjs&amp;logoColor=white" alt="Node.js 22 or newer" />
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#getting-started">Getting started</a> ·
  <a href="#database">Database</a> ·
  <a href="#admin">Admin panel</a> ·
  <a href="#deployment">Deployment</a> ·
  <a href="#troubleshooting">Troubleshooting</a>
</p>

---

## ✨ About the project

Forma & Co. brings product discovery, variant selection, checkout, customer accounts, and everyday store operations into one Next.js application. Customers can browse furniture, save favourites, redeem rewards, and follow their orders. Administrators manage the catalog, inventory, promotions, staff permissions, and fulfillment from a protected dashboard.

The application uses **Sri Lankan rupees (LKR)** and displays dates in **Asia/Colombo**. Supabase provides PostgreSQL, authentication, and image storage; PayHere handles hosted online checkout.

> **Setup status:** The catalog requires a configured Supabase database. This is not an offline demo. The local SQL migrations and seed are currently excluded by the repository's `*.sql` Git ignore rule, and the configured test suites are not populated. See [database availability](#database) and [verification](#verification) before setting up a fresh clone.

## 🧭 Contents

- [Features](#features)
- [Technology stack](#stack)
- [Getting started](#getting-started)
- [Environment variables](#environment)
- [Database and sample catalog](#database)
- [Authentication and email templates](#authentication)
- [Admin panel and staff access](#admin)
- [Checkout, payments, and fulfillment](#payments)
- [Application routes](#routes)
- [API overview](#api)
- [Project structure](#structure)
- [Scripts and verification](#verification)
- [Deployment](#deployment)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)
- [Contributing and licensing](#contributing)

<a id="features"></a>

## 🌟 Features

### 🛍️ Storefront

- Home page with editable promotional slides and featured products.
- Product browsing with search, filters, sorting, categories, and subcategories.
- Product detail pages with image galleries, dimensions, materials, and available finishes.
- Variant pricing, SKU-based inventory, and stock availability indicators.
- Shopping bag with quantity controls and delivery estimates.
- Delivery and scheduled store pickup.
- PayHere, cash, and WhatsApp ordering options.
- Coupon discounts and loyalty point redemption.
- Help, FAQ, warranty, refund policy, and terms pages.

### 👤 Customer accounts

- Email/password registration, login, email confirmation, and password recovery.
- Editable profile and saved delivery address.
- Wishlist for signed-in customers.
- Order history, order details, courier information, and tracking numbers.
- Downloadable PDF invoices.
- Reward point balance and transaction history.
- Cancellation of eligible pending, unpaid orders.

### 🧑‍💼 Store administration

- Dashboard showing paid revenue, order counts, pending orders, product counts, and low stock.
- Product, image gallery, variant, category, and subcategory management.
- Inventory updates and low-stock visibility for variants at **10 units or fewer**.
- Order status updates, payment event visibility, and delivery tracking details.
- Home page promotion management.
- Percentage and fixed-value coupons with validity and usage controls.
- Configurable delivery fees, free-delivery threshold, contact details, pickup hours, and rewards.
- Staff accounts and configurable permissions for each admin area.

### 🔐 Implementation safeguards

- Supabase sessions and database row-level security.
- Server-side permission checks for protected pages and API actions.
- Request validation with Zod and origin checks for browser mutations.
- Database order functions that calculate prices and reserve stock atomically.
- Signature verification before recording PayHere notifications.
- Upload checks for file signatures, allowed image formats, size, and bucket permissions.

<a id="stack"></a>

## 🧰 Technology stack

| Layer          | Technology                                  | Role                                                         |
| -------------- | ------------------------------------------- | ------------------------------------------------------------ |
| Application    | Next.js **16.3.8**, App Router              | Pages, layouts, server rendering, and route handlers         |
| Interface      | React **19.3.0**, TypeScript                | Components and application types                             |
| Styling        | Custom CSS                                  | Global styles, reset, and theme tokens                       |
| Icons          | Lucide React                                | Storefront and admin interface icons                         |
| Backend        | Supabase / PostgreSQL                       | Catalog, accounts, orders, permissions, and storage          |
| Authentication | Supabase Auth + `@supabase/ssr`             | Cookie-based authentication                                  |
| Validation     | Zod                                         | API input schemas                                            |
| Payments       | PayHere                                     | Hosted checkout in LKR                                       |
| Invoices       | `pdf-lib`                                   | PDF generation                                               |
| Formatting     | Prettier                                    | Repository formatting                                        |
| Test tooling   | Node test runner, `tsx`, Playwright, PGlite | Dependencies/configuration present; suites currently missing |

Versions above reflect [package.json](package.json). Use [package-lock.json](package-lock.json) and `npm ci` to install the resolved dependency set.

<a id="getting-started"></a>

## 🚀 Getting started

### 1. Check prerequisites

- **Node.js 22 or newer**, as required by this project's `engines` field.
- npm and a local checkout of this repository.
- A Supabase project and access to its SQL editor and authentication settings.
- The SQL setup files listed [below](#database), which may need to be obtained from the project maintainer.
- PayHere sandbox credentials if you want to exercise online checkout.
- A business WhatsApp number if you want to enable WhatsApp order links.

### 2. Install dependencies

Run from the repository root:

```bash
npm ci
```

### 3. Create the local environment file

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

macOS / Linux:

```bash
cp .env.example .env.local
```

For an existing setup, edit `.env.local` without replacing its values. Fill in the variables described in the next section. Keep actual credentials out of commits and documentation.

### 4. Prepare Supabase

Apply the [database setup](#database), configure [authentication](#authentication), and create your [first administrator](#admin).

### 5. Start the application

```bash
npm run dev
```

Open `http://localhost:3000` for the storefront and `http://localhost:3000/admin` for admin sign-in. Use this same host in `NEXT_PUBLIC_APP_URL`; `localhost` and `127.0.0.1` are different origins.

<a id="environment"></a>

## ⚙️ Environment variables

Start with [.env.example](.env.example). Configuration is resolved in [src/lib/config.ts](src/lib/config.ts).

| Variable                               | Purpose                                                                     | Needed for                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                  | Exact app origin, such as `http://localhost:3000`, without a trailing slash | Auth redirects, mutation origin validation, and payment callbacks          |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project URL                                                        | Database and authentication                                                |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key; a legacy `anon` key is also accepted              | Customer/session database access                                           |
| `SUPABASE_SECRET_KEY`                  | Server-only Supabase secret                                                 | Verified payment notifications **and staff account/access administration** |
| `PAYHERE_MERCHANT_ID`                  | PayHere merchant identifier                                                 | Online checkout                                                            |
| `PAYHERE_MERCHANT_SECRET`              | Server-only merchant secret                                                 | Checkout hashes and notification verification                              |
| `PAYHERE_MODE`                         | `sandbox` or `live`; anything except exact `live` selects sandbox           | Payment environment                                                        |
| `WHATSAPP_BUSINESS_NUMBER`             | International number with country code, e.g. `94771234567`                  | WhatsApp order links                                                       |

The `.env.example` comment currently describes the Supabase secret as payment-only; the staff API also uses it. Never place that secret or a service-role key in a `NEXT_PUBLIC_` variable.

<details>
<summary><strong>Supported deployment aliases</strong></summary>

- `APP_URL` takes precedence over `NEXT_PUBLIC_APP_URL`.
- `SUPABASE_URL` is a fallback for `NEXT_PUBLIC_SUPABASE_URL`.
- Public-key candidates are checked in this order: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_API_KEY`, `SUPABASE_ANON_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY` is a fallback for `SUPABASE_SECRET_KEY`.
- `WHATSAPP_NUMBER` is a fallback for `WHATSAPP_BUSINESS_NUMBER`.

Only publishable keys and legacy keys with the `anon` role are accepted for public/session access. Secret and service-role keys are rejected for that purpose.

</details>

Restart the development server after changing environment values. Supply production values when building and running the deployed application.

<a id="database"></a>

## 🗄️ Database and sample catalog

**Fresh-clone prerequisite:** This workspace contains `supabase/migrations/001_store.sql` through `008_tracking.sql` and `supabase/seed.sql`, but they are not tracked in Git because [.gitignore](.gitignore) excludes `*.sql`. Obtain these files from the maintainer before following the setup. The paths below describe the local setup files; a clone alone currently does not provide them.

There is no checked-in Supabase CLI configuration. The existing SQL files are intended to be applied through the Supabase SQL editor.

### Setup order

For a new project with the sample catalog, run one file at a time in this order:

| Step | SQL file                                 | What it adds                                                                          |
| ---- | ---------------------------------------- | ------------------------------------------------------------------------------------- |
| 1    | `supabase/migrations/001_store.sql`      | Profiles, catalog, variants, orders, payment events, RLS, and core database functions |
| 2    | `supabase/migrations/002_storage.sql`    | Product/category image buckets and storage policies                                   |
| 3    | `supabase/seed.sql`                      | Optional sample furniture catalog, images, and variants                               |
| 4    | `supabase/migrations/003_settings.sql`   | Configurable delivery pricing                                                         |
| 5    | `supabase/migrations/004_storefront.sql` | Subcategories, promotional slides, store contact details, COD, and pickup             |
| 6    | `supabase/migrations/005_account.sql`    | Saved customer addresses                                                              |
| 7    | `supabase/migrations/006_rewards.sql`    | Wishlists, coupons, loyalty balances, and points ledger                               |
| 8    | `supabase/migrations/007_staff.sql`      | Staff roles, area permissions, and updated access policies                            |
| 9    | `supabase/migrations/008_tracking.sql`   | Courier names and tracking numbers                                                    |

Seeding before `004_storefront.sql` allows that migration to place the sample products into its starter subcategories. Skip the seed for a catalog you will populate yourself. On an existing database, apply only missing migrations in sequence; the initial schema and storage scripts are not general-purpose rerunnable migrations.

The sample seed contains six top-level categories, eight products, and sixteen variants, including an out-of-stock example. Its illustrative images are stored in `public/images/`. These are database seed records, not an automatic in-code fallback.

### Data model

| Area                | Tables                                                         |
| ------------------- | -------------------------------------------------------------- |
| Accounts and access | `profiles`, `staff_roles`                                      |
| Catalog             | `categories`, `products`, `product_images`, `product_variants` |
| Orders and payments | `orders`, `order_items`, `payment_events`                      |
| Store configuration | `store_settings`, `promo_slides`                               |
| Customer engagement | `wishlist_items`, `coupons`, `loyalty_ledger`                  |

Order items preserve the product name, variant details, quantity, and price for the order. Database functions own order creation, stock reservation, status transitions, coupon usage, and reward changes.

### Image storage

| Bucket            | Managed from | Accepted uploads            |
| ----------------- | ------------ | --------------------------- |
| `product-images`  | Products     | JPG, PNG, WebP; up to 5 MiB |
| `category-images` | Categories   | JPG, PNG, WebP; up to 5 MiB |
| `promo-images`    | Promo slides | JPG, PNG, WebP; up to 5 MiB |

Images are publicly readable. Writes require the matching staff permission or administrator access. The promo bucket is added by migration `004`, and migration `007` updates storage permissions for staff roles.

<a id="authentication"></a>

## ✉️ Authentication and email templates

1. Configure Supabase email/password authentication for the project.
2. Set the Auth **Site URL** to the application's origin. The provided templates use `{{ .SiteURL }}` directly.
3. Allow the callback URLs used by the app, including `/auth/callback` and `/auth/callback?next=/account/security` on the appropriate development or production origin.
4. Copy the HTML from [supabase/email-templates](supabase/email-templates) into the matching Supabase email template fields.
5. Configure email delivery for your environment and verify signup and password recovery end to end.

The thirteen provided templates cover signup confirmation, invitations, magic links, email changes, password resets, reauthentication, password/email/phone change notifications, linked/unlinked sign-in methods, and added/removed MFA methods. Template availability does not mean every corresponding account-management screen is implemented in this app.

The [auth callback](src/app/auth/callback/route.ts) handles both authorization codes and hashed email tokens. Recovery and invitation links lead to `/account/security`; email-change links lead to `/account/profile`.

Review the contact details embedded in the email HTML before deployment; updating store settings does not rewrite those templates.

<a id="admin"></a>

## 🧑‍💼 Admin panel and staff access

### Create the first administrator

Register your own account at `/register` and complete email confirmation if enabled. Then use the Supabase SQL editor to promote that specific account:

```sql
update public.profiles
set role = 'ADMIN', staff_role_id = null
where id = (
  select id
  from auth.users
  where email = 'your-admin@example.com'
)
returning id, email, role;
```

Replace the example address with your actual registered address and confirm that exactly the intended row is returned. This example assumes all migrations, including `007_staff.sql`, have been applied. Sign in at `/admin`. There are no seeded administrator credentials.

### Access model

| Account type | Access                                                    |
| ------------ | --------------------------------------------------------- |
| `CUSTOMER`   | Personal account, wishlist, rewards, and own orders       |
| `STAFF`      | Admin areas explicitly granted by the assigned staff role |
| `ADMIN`      | All areas, including staff accounts and role management   |

Assignable areas are `dashboard`, `orders`, `products`, `categories`, `inventory`, `promos`, `coupons`, and `settings`.

Migration `007` provides three starter roles when no roles exist:

- **Store manager:** all eight assignable areas.
- **Order desk:** dashboard and orders.
- **Catalogue editor:** products, categories, inventory, and promotions.

Full administrators can create staff accounts and change access through `/admin/staff`, and manage permission sets through `/admin/roles`. These operations need the server-only Supabase secret. Staff accounts created through the admin API are already email-confirmed; they are not sent through an invitation flow by that endpoint.

<a id="payments"></a>

## 💳 Checkout, payments, and fulfillment

Customers sign in before placing orders. Checkout submits variant IDs and quantities; PostgreSQL validates availability and calculates the authoritative totals.

| Method       | Behavior                                                                              | Configuration                                                      |
| ------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| PayHere      | Redirects to hosted checkout; payment is recorded from a verified server notification | Merchant ID, merchant secret, server-only Supabase secret, app URL |
| Cash (`COD`) | Supports cash settlement; marked paid when the order reaches `DELIVERED`              | Storefront migration and store setup                               |
| WhatsApp     | Generates a prefilled message containing order items, totals, and customer details    | Business WhatsApp number                                           |

WhatsApp opens a conversation link; it does not automatically send a message or verify receipt of payment.

### PayHere callbacks

The checkout route constructs these URLs from the configured app origin:

| Callback             | Path                             |
| -------------------- | -------------------------------- |
| Payment notification | `/api/payments/notification`     |
| Browser return       | `/orders/{id}?payment=returned`  |
| Browser cancellation | `/orders/{id}?payment=cancelled` |

Use `PAYHERE_MODE=sandbox` while testing. For callback testing, the app needs a publicly reachable origin; PayHere cannot reach a notification endpoint on your machine's `localhost`. Align the app origin, Supabase auth configuration, and merchant configuration with the environment being tested.

A browser return does **not** mark an order paid. The notification handler checks the merchant, currency, status, amount format, and signature before calling `record_payment`. Orders requiring payment review are blocked from normal fulfillment.

### Order lifecycle

```text
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
    Eligible orders before shipping → CANCELLED
```

- Customers can cancel their own pending orders only when they are unpaid.
- Staff with order permissions manage fulfillment transitions.
- PayHere orders need verified payment before fulfillment can advance.
- Valid cancellation restores reserved stock, redeemed points, and coupon usage through database logic.
- Cancelling a paid order flags it for review; it does not issue an automatic payment refund.
- Reward points are earned when orders are delivered or collected.
- Courier and tracking values are entered by staff; there is no courier API integration in this implementation.
- Pickup orders use the same underlying status values and cannot receive courier tracking details.

<a id="routes"></a>

## 🗺️ Application routes

| Area                | Routes                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| Shopping            | `/`, `/products`, `/products/[slug]`, `/cart`, `/checkout`                                                     |
| Authentication      | `/login`, `/register`, `/forgot-password`, `/auth/callback`                                                    |
| Customer account    | `/account`, `/account/profile`, `/account/address`, `/account/security`, `/account/password`                   |
| Customer engagement | `/account/wishlist`, `/account/rewards`                                                                        |
| Orders              | `/orders`, `/orders/[id]`, `/account/orders`                                                                   |
| Information         | `/help`, `/faq`, `/warranty`, `/refund-policy`, `/terms`                                                       |
| Admin entry         | `/admin`, `/admin/login`                                                                                       |
| Admin overview      | `/admin/dashboard`                                                                                             |
| Catalog management  | `/admin/products`, `/admin/products/new`, `/admin/products/[id]/edit`, `/admin/categories`, `/admin/inventory` |
| Order management    | `/admin/orders`, `/admin/orders/[id]`                                                                          |
| Store management    | `/admin/promos`, `/admin/coupons`, `/admin/settings`                                                           |
| Access management   | `/admin/staff`, `/admin/roles`                                                                                 |

`[id]` and `[slug]` represent dynamic URL values. The `(protected)` source directory is a route group and does not appear in URLs.

<a id="api"></a>

## 🔌 API overview

These route handlers serve the application. Authorization depends on the operation: catalog reads can be public, personal resources require a session, and management actions require the relevant permission. Staff/role administration is restricted to full administrators.

| Endpoint                     | Methods                  | Purpose                                            |
| ---------------------------- | ------------------------ | -------------------------------------------------- |
| `/api/auth/[action]`         | `POST`                   | `register`, `login`, `logout`, `reset`, `password` |
| `/api/profile`               | `PATCH`                  | Profile and saved address updates                  |
| `/api/products`              | `GET`, `POST`            | Catalog listing and product creation               |
| `/api/products/[id]`         | `GET`, `PATCH`, `DELETE` | Individual product operations                      |
| `/api/categories`            | `GET`, `POST`, `DELETE`  | Category management                                |
| `/api/inventory`             | `PATCH`                  | Variant stock updates                              |
| `/api/orders`                | `GET`, `POST`            | Order listing and placement                        |
| `/api/orders/[id]`           | `GET`                    | Order details                                      |
| `/api/orders/[id]/status`    | `PATCH`                  | Order status and tracking updates                  |
| `/api/orders/[id]/invoice`   | `GET`                    | PDF invoice                                        |
| `/api/orders/[id]/whatsapp`  | `GET`                    | WhatsApp order link                                |
| `/api/payments/payhere`      | `POST`                   | Signed hosted-checkout fields                      |
| `/api/payments/notification` | `POST`                   | Signature-verified PayHere form notification       |
| `/api/wishlist`              | `GET`, `POST`, `DELETE`  | Customer favourites                                |
| `/api/coupons`               | `GET`, `POST`, `DELETE`  | Coupon management                                  |
| `/api/coupons/preview`       | `POST`                   | Customer coupon validation                         |
| `/api/slides`                | `GET`, `POST`, `DELETE`  | Promotional slides                                 |
| `/api/settings`              | `GET`, `PATCH`           | Store configuration                                |
| `/api/staff`                 | `POST`, `PATCH`          | Staff creation and access changes                  |
| `/api/staff/roles`           | `POST`, `DELETE`         | Staff role management                              |
| `/api/uploads`               | `POST`                   | Multipart image uploads                            |

Browser mutation requests must send an `Origin` matching the configured app origin and the appropriate session cookies. PayHere notifications instead use form encoding and signature verification. See [src/lib/validation.ts](src/lib/validation.ts) and the relevant handler under [src/app/api](src/app/api) for exact request bodies.

<a id="structure"></a>

## 📁 Project structure

```text
.
├── public/images/              # Brand logo and illustrative furniture images
├── src/
│   ├── app/
│   │   ├── account/            # Customer profile, address, orders, wishlist, rewards
│   │   ├── admin/              # Admin login and protected management screens
│   │   ├── api/                # Server route handlers
│   │   ├── auth/callback/      # Email-token and auth-code callback
│   │   ├── products/           # Catalog and product detail pages
│   │   ├── checkout/           # Checkout page
│   │   ├── orders/             # Customer order pages
│   │   ├── globals.css         # Application styles
│   │   ├── reset.css           # Base CSS reset
│   │   └── theme.css           # Theme tokens and visual foundations
│   ├── components/             # Shared storefront, account, and admin components
│   ├── lib/                    # Auth, config, validation, payments, invoices, helpers
│   ├── services/               # Server-side data access
│   ├── types/                  # Shared TypeScript models
│   └── proxy.ts                # Request-time Supabase session handling
├── supabase/
│   ├── email-templates/        # Thirteen branded authentication email templates
│   ├── migrations/             # Local SQL setup files; currently Git-ignored
│   └── seed.sql                # Local sample catalog; currently Git-ignored
├── tests/e2e/                  # Local empty directory; test suites not supplied
├── .env.example                # Environment variable template
├── next.config.ts              # Next.js configuration and response headers
├── playwright.config.ts        # Desktop/mobile browser test configuration
├── package.json                # Dependencies and npm scripts
└── package-lock.json           # Resolved dependency versions
```

<a id="verification"></a>

## 🧪 Scripts and verification

| Command                | Purpose                          | Current notes                                           |
| ---------------------- | -------------------------------- | ------------------------------------------------------- |
| `npm run dev`          | Start development server         | Supabase required for catalog/account functionality     |
| `npm run build`        | Create production build          | Configure the deployment environment first              |
| `npm start`            | Run production server            | Requires a completed build                              |
| `npm run typecheck`    | Check app and test TypeScript    | Second command references missing `tests/tsconfig.json` |
| `npm test`             | Run `tests/*.test.ts` with `tsx` | No matching test files currently supplied               |
| `npm run test:e2e`     | Run Playwright                   | No browser test specs currently supplied                |
| `npm run format:check` | Check repository formatting      | Read-only formatting check                              |
| `npm run format`       | Format the repository            | Rewrites supported files                                |

For an application-only type check with the current checkout:

```bash
npx tsc --noEmit
```

The Playwright configuration defines desktop Chrome and an iPhone 13 viewport running Chromium. Once test specs are restored or added, install Chromium with `npx playwright install chromium`, prepare the seeded Supabase project, and run `npm run test:e2e`. The configuration supports `E2E_PORT` for a separate development port and retains traces on failure.

There is no configured `lint` script and no passing test-suite claim is made here.

### Manual smoke test after setup

1. Browse the catalog, open a product, choose a finish, and update bag quantities.
2. Register, confirm email, sign in, and verify password recovery.
3. Save an address and wishlist item, then check the account pages.
4. Place a test order using an enabled method and inspect its invoice and order history.
5. For PayHere, verify a sandbox notification updates the order's payment state.
6. As an administrator, update inventory, a promotion, and delivery settings.
7. Verify a restricted staff account can access only its assigned management areas.
8. Exercise eligible cancellation, courier details, and reward changes in the test environment.

<a id="deployment"></a>

## 🌍 Deployment

This application requires a **Node.js runtime with server-side Next.js support**. A static export cannot serve its authentication, API routes, payment callbacks, and database operations.

For a Node.js deployment:

```bash
npm ci
npm run build
npm start
```

Before opening the store to customers:

- Apply the full database setup to the production Supabase project.
- Set environment variables on the host, including the public HTTPS app origin.
- Set Supabase's Site URL and allowed callback URLs for the production domain.
- Configure and verify the authentication email templates and delivery.
- Create the first administrator and review store settings and catalog content.
- Configure PayHere credentials for the intended environment; set `PAYHERE_MODE=live` only when intentionally enabling live payments.
- Confirm the payment notification route is reachable and test the checkout flow.
- Set the business WhatsApp number and review the customer-facing policy pages.

The repository does not include a Dockerfile, hosting-specific deployment pipeline, or automated migration runner. Keep the database migration sequence as an explicit deployment step.

<a id="customization"></a>

## 🎨 Customization

| Change                                              | Where to work                                                                                                  |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| README brand logo                                   | [public/images/forma-logo.png](public/images/forma-logo.png)                                                   |
| Colors and theme tokens                             | [src/app/theme.css](src/app/theme.css)                                                                         |
| Application styling                                 | [src/app/globals.css](src/app/globals.css), [src/app/reset.css](src/app/reset.css)                             |
| Navigation and footer                               | [src/components/header.tsx](src/components/header.tsx), [src/components/footer.tsx](src/components/footer.tsx) |
| Page shell and metadata                             | [src/app/layout.tsx](src/app/layout.tsx)                                                                       |
| Catalog, prices, and images                         | Admin → Products / Categories / Inventory                                                                      |
| Home page promotions                                | Admin → Promo slides                                                                                           |
| Delivery, pickup, contact details, and reward rates | Admin → Settings                                                                                               |
| Authentication email branding                       | [supabase/email-templates](supabase/email-templates) and the matching Supabase templates                       |

The supplied Forma & Co. PNG is stored in the repository so the README logo renders without depending on a local Downloads path. Technology badges use external Shields.io images; the brand logo is local.

<a id="troubleshooting"></a>

## 🛠️ Troubleshooting

| Symptom                                      | What to check                                                                                      |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Store database is not connected              | Supabase URL and a valid publishable/anon key in `.env.local`; restart the server                  |
| Catalog is empty                             | Seed the database or create active categories, products, and variants in admin                     |
| SQL files are missing from a clone           | The current `*.sql` ignore rule excludes them; obtain the migration/seed files from the maintainer |
| Dashboard reports a database update          | Apply the named missing migration and its prerequisites in order                                   |
| Account exists but admin access is denied    | Verify that account's `profiles.role` is `ADMIN`, or assign the appropriate staff role             |
| Staff creation or access changes fail        | Check `SUPABASE_SECRET_KEY` and confirm the caller is a full administrator                         |
| Request origin is not allowed                | Match scheme, hostname, and port to `APP_URL` / `NEXT_PUBLIC_APP_URL`                              |
| Confirmation/reset link returns to login     | Check the Site URL, allowed callback URLs, email template, and token validity                      |
| PayHere is unavailable                       | Check merchant ID, merchant secret, server-only Supabase key, and app URL                          |
| Payment returned but order remains pending   | Check notification delivery and signature verification; browser return alone is insufficient       |
| WhatsApp link is unavailable                 | Set a valid international business number and restart the server                                   |
| Image upload is rejected                     | Use a nonempty JPG/PNG/WebP no larger than 5 MiB; check bucket setup and area permissions          |
| Coupons, pickup, or rewards are unavailable  | Apply the migrations that introduce the relevant settings and tables                               |
| Test/typecheck scripts fail on missing files | Restore the missing suites and `tests/tsconfig.json`; use `npx tsc --noEmit` for app-only checking |

<a id="contributing"></a>

## 🤝 Contributing and licensing

Keep changes focused, follow the existing TypeScript/CSS conventions, and validate the affected customer or admin flow. Update environment documentation when configuration changes and provide the corresponding SQL migration when changing database behavior.

Read [AGENTS.md](AGENTS.md) before modifying application code. This repository requires checking the documentation shipped in `node_modules/next/dist/docs/` because its Next.js version may differ from familiar APIs and conventions.

The package is marked `private`, and no license file is currently included. This README does not grant permission to redistribute the application, logo, or other brand assets; confirm usage terms with the owner.

---

<p align="center">
  <strong>🛋️ Forma & Co.</strong><br />
  Furniture for a life well lived.
</p>

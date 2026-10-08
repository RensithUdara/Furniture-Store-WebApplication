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
- Sale prices: a struck-through “was” price and a percentage-off badge per finish.
- Ratings and reviews, accepted only from customers whose order containing the product was delivered.
- Side-by-side comparison of up to four products (price, rating, material, dimensions, finishes, availability).
- “Recently viewed” (kept in the browser) and “Customers also bought” (from real order history) rows.
- Back-in-stock requests on sold-out finishes, for signed-in customers and guests.
- Guest checkout with a private order link, and order tracking without an account.
- Estimated delivery dates by district, shown at checkout and stored on the order.
- An AI shopping assistant (Claude) in a chat window: it searches the live catalogue, explains delivery, payment and returns from the store's settings, and checks an order's status given the order number and the contact used on it. It can only look things up. It is shown when `ANTHROPIC_API_KEY` is set.
- Flash sales: a percentage off chosen products or the whole store between two moments, with a countdown. The database charges the sale price itself.
- Newsletter signup in the footer, with one-click unsubscribe; staff download the list as CSV.
- A signed-in customer’s bag is kept on the server, follows them between devices, and can trigger one reminder email.
- Search-engine optimisation: `sitemap.xml`, `robots.txt`, a title, description and canonical address on every public page, a page per category, structured data (store, site search, product, breadcrumbs, FAQ, product lists), share previews, site icons and a web manifest. Categories have clean addresses (`/category/sofas`; old `?category=` links redirect permanently), unknown products and categories answer with a real 404, and “Load more” is a followable link. Storefront images are resized and served in modern formats, and the public catalogue and settings are shared between requests for up to 30 seconds (dropped at once when anything changes through the app). Private pages, searches and filtered views are kept out of the index. `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION` add the ownership tags.
- Search suggestions as you type in the header, with product thumbnails and matching categories.
- Catalogue filters for material, colour, size and room, with shareable filter links.
- The catalogue is filtered on the server and sent 24 products at a time, with “Load more”.
- Hover zoom and a full-screen gallery on the product page, with an optional product video (YouTube or .mp4/.webm link).
- Room sets: products that cost less when ordered together. The database applies the saving when the order is saved.
- Help, FAQ, warranty, refund policy, and terms pages.

### 👤 Customer accounts

- Email/password registration, login, email confirmation, and password recovery.
- Editable profile and an address book (home, office, …) with one default.
- Wishlist for signed-in customers.
- Order history, order details, courier information, and tracking numbers.
- Downloadable PDF invoices.
- Reward point balance and transaction history.
- Cancellation of eligible pending, unpaid orders.
- Return and refund requests from the order page within the store’s return period, with a visible status.
- A list of back-in-stock requests, marked when the item returns.

### 🧑‍💼 Store administration

- Dashboard showing paid revenue, order counts, pending orders, product counts, and low stock.
- Product, image gallery, variant, category, and subcategory management.
- Inventory updates and low-stock visibility for variants at **10 units or fewer**.
- Order status updates, payment event visibility, and delivery tracking details.
- Home page promotion management.
- Percentage and fixed-value coupons with validity and usage controls.
- Configurable delivery fees, free-delivery threshold, contact details, pickup hours, and rewards.
- Staff accounts and configurable permissions for each admin area.
- Optional “was” price per variant, delivery times per district, and the return period.
- Return requests approved, rejected, or marked refunded from the order page, with a note to the customer.
- A waiting list of customers who asked for sold-out items, shown under inventory.
- Sales reports by day, week and month with best sellers, downloadable as CSV or Excel; sales-trend and top-category charts on the dashboard.
- A reorder level per finish, a stock history (who changed what, when and why), and optional low-stock emails.
- Bulk product import and edit from a spreadsheet (CSV), with a per-product result.
- A customer list with order count, total spent and reward points, and manual point adjustments.
- Refunds on paid orders: through PayHere’s Refund API, or recorded by hand.
- A printable packing slip and delivery note for each order.
- An activity log of what admins and staff changed.
- A delivery fee per district, in place of one flat fee.
- Unpaid PayHere orders cancelled automatically after a configurable time, and rate limits on sign-in, checkout, and lookups.

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

**Fresh-clone prerequisite:** This workspace contains `supabase/migrations/001_store.sql` through `014_marketing.sql` and `supabase/seed.sql`, but they are not tracked in Git because [.gitignore](.gitignore) excludes `*.sql`. Obtain these files from the maintainer before following the setup. The paths below describe the local setup files; a clone alone currently does not provide them.

There is no checked-in Supabase CLI configuration. The existing SQL files are intended to be applied through the Supabase SQL editor.

### Data model

| Area                | Tables                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------- |
| Accounts and access | `profiles`, `staff_roles`                                                                     |
| Catalog             | `categories`, `products`, `product_images`, `product_variants`                                |
| Orders and payments | `orders`, `order_items`, `payment_events`, `order_events`, `return_requests`                  |
| Store configuration | `store_settings`, `promo_slides`, `delivery_zones`                                            |
| Customer engagement | `wishlist_items`, `coupons`, `loyalty_ledger`, `product_reviews`, `stock_alerts`, `addresses` |

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
- A guest order has no account. It is reached through an unguessable link (`/orders/guest/[token]`) and is created by a server-only database function; guests cannot use coupons or points.
- A return can be requested once per delivered order, inside the return period. Staff approve, reject, or mark it refunded. Marking it refunded records the decision only; the money is returned with the refund tool on the same page (see below).
- A refund is made on a paid order from its admin page. “Refund through PayHere” returns the whole payment to the customer’s card using PayHere’s Refund API and needs `PAYHERE_APP_ID` and `PAYHERE_APP_SECRET`; a manual refund records money returned another way, for any amount still refundable. A refund also settles an approved return on the order.
- Abandoned-bag reminders go only to signed-in customers (guests have no email on file), once per bag, after the number of hours set in Admin → Settings (0 switches them off). They need `RESEND_API_KEY`, `EMAIL_FROM` and `APP_URL`. The store sends due reminders in the background when its home page is visited; to make the timing independent of traffic, have a scheduler call `GET /api/cron/reminders` with the header `Authorization: Bearer <CRON_SECRET>`.
- The newsletter list is collected and exported; the app does not send newsletters itself. Signup is single opt-in.
- Low-stock emails are sent through Resend when `RESEND_API_KEY`, `EMAIL_FROM` and `ALERT_EMAIL_TO` are set: one email when a finish reaches its reorder level, and again only after it has been restocked and fallen back. Without those settings the dashboard and inventory page still flag low stock.
- Back-in-stock requests are marked ready when stock returns. The app does not send the email itself; staff contact the customer from the waiting list.

<a id="routes"></a>

## 🗺️ Application routes

| Area                | Routes                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| Shopping            | `/`, `/products`, `/products/[slug]`, `/category/[slug]`, `/compare`, `/bundles`, `/cart`, `/checkout`                                         |
| Authentication      | `/login`, `/register`, `/forgot-password`, `/auth/callback`                                                    |
| Customer account    | `/account`, `/account/profile`, `/account/address`, `/account/security`, `/account/password`                   |
| Customer engagement | `/account/wishlist`, `/account/rewards`                                                                        |
| Orders              | `/orders`, `/orders/[id]`, `/orders/guest/[token]`, `/track`, `/account/orders`                                |
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
| `/api/track`                 | `POST`                   | Order lookup by number and email or phone          |
| `/api/reviews`               | `POST`, `DELETE`         | Verified-buyer reviews                             |
| `/api/stock-alerts`          | `POST`, `DELETE`         | Back-in-stock requests                             |
| `/api/addresses`             | `POST`, `DELETE`         | Customer address book                              |
| `/api/returns`               | `POST`, `PATCH`          | Return requests and staff decisions                |
| `/api/zones`                 | `GET`, `PUT`             | Delivery times by district                         |
| `/api/products/suggest`      | `GET`                    | Search-as-you-type suggestions                     |
| `/api/bundles`               | `GET`, `POST`, `DELETE`  | Room sets                                          |
| `/api/reports`               | `GET`                    | Sales report download (CSV or Excel)               |
| `/api/assistant`             | `POST`                   | Shopping assistant; answers stream as JSON lines   |
| `/api/newsletter`            | `GET`, `POST`, `DELETE`  | Subscribe; staff list (CSV) and removal            |
| `/api/cart`                  | `GET`, `PUT`             | A signed-in customer’s saved bag                   |
| `/api/flash-sales`           | `POST`, `DELETE`         | Flash sales                                        |
| `/api/cron/reminders`        | `GET`                    | Sends due bag reminders (needs `CRON_SECRET`)      |
| `/api/products/export`       | `GET`                    | Every product as a CSV spreadsheet                 |
| `/api/products/import`       | `POST`                   | Create and update products from spreadsheet rows   |
| `/api/customers/points`      | `POST`                   | Manual reward point adjustment                     |
| `/api/orders/[id]/refund`    | `POST`                   | PayHere or manual refund                           |

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

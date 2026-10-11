# Evergreen Market

A bilingual (English and Burmese) store-selling prototype built with Next.js App Router, React, TypeScript, and Tailwind CSS. Store accounts, product listings, orders, support requests, and wallet actions are persisted server-side in a local JSON file for a single-server demo.

## Start locally

Requirements: Node.js 20.9+ and npm.

```powershell
npm install
npm run dev
```

Store session secrets are generated locally on first use and saved in ignored files under `data/`. For deployments where that directory is ephemeral or shared across app instances, configure stable secrets in `.env.local`:

```text
STORE_SESSION_SECRET=<optional random value of at least 32 characters>
STORE_PLATFORM_DATA_DIR=<optional persistent directory for the JSON database>
STORE_INVITATION_CODE=<optional private signup invitation code>
CUSTOMER_SERVICE_PHONE=<private staff phone number>
CUSTOMER_SERVICE_PASSWORD=<private staff password>
CUSTOMER_SERVICE_SESSION_SECRET=<optional different random value of at least 32 characters>
```

Generate random secrets in PowerShell with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Keep `.env.local` private and never use `NEXT_PUBLIC_` for these values. The restricted dashboard is intentionally not linked from the storefront; visit `/admin-cs-dashboard` and sign in with the configured staff credentials. Staff phone and password must be configured; session signing secrets can be generated automatically for a single persistent local server.

## Store workflow

- New visitors must register or sign in before entering product, cart, checkout, or account pages.
- Registration requires phone, store name, address, and a password. A unique Store ID is issued on the server. Passwords are stored as salted scrypt hashes; the original passwords are never returned or shown to staff.
- Every store receives a unique referral code. Registering with another store's code gives both the new store and referrer a $30.00 bonus (MMK 135,000 at the demo rate of USD 1 = MMK 4,500). Both bonuses remain locked until the relevant store completes a successful delivered product sale. The legacy `STORE_INVITATION_CODE`, if configured, can still award a signup-only bonus.
- Store owners can list products without an upfront charge. Their sale price is calculated at 110% of stated product cost. Customer-service staff confirm delivery; the seller then receives the product cost plus 10% profit in their wallet.
- Store product, cart, checkout, and wallet amounts display USD first followed by the approximate MMK conversion at MMK 4,500 per USD. The language selector offers only English and Burmese.
- The catalog contains 700 distinct products in seven categories. Every catalog price and new seller listing is at least MMK 300,000. Each catalog item has its own locally generated SVG cover illustration, color variant, model/specification details, and product description.
- The account page shows store and wallet details, supports no-upfront-cost product listings, and can submit support tickets. Customer-service staff can resolve tickets, verify and record deposits, process withdrawals, and confirm successful deliveries.

## Prototype and deployment limitations

`data/store-platform.json` is created on first write and ignored by Git (or in `STORE_PLATFORM_DATA_DIR` if configured). It contains store profiles, password hashes, registration IP addresses, referral codes, wallet balances, products, orders, support tickets, and wallet entries. Keep this file private and backed up. The local JSON file and generated session keys are suitable only for a single persistent server instance; concurrent or ephemeral multi-instance deployment requires a transactional database and shared session infrastructure. When hosting through ngrok, keep the server process and database/session-key directory running and persistent.

Checkout and wallet entries are demonstrations, not real payment processing. No customer payment is collected, no funds are transferred, and a staff-entered deposit/withdrawal is only a record after external verification. Do not deploy this prototype to hold real funds or sensitive production data. Before launch, replace local JSON storage with a database, add a payment provider and delivery verification, configure trusted proxy IP headers, and apply production monitoring, backups, rate limiting, and account recovery controls.

The signup bonus is stored in the same wallet balance but flagged as locked until a delivered seller order. Staff cannot withdraw the locked bonus. The customer-service interface never exposes password hashes or plaintext passwords.

## Project structure

```text
app/
  account/                     Store dashboard, listings, wallet and support form
  admin-cs-dashboard/          Unlinked staff login and support/ledger panel
  api/store/                   Server-side store accounts, products, and orders
  api/customer-service/        Staff authentication and protected operations
  api/support/tickets/         Authenticated support ticket creation
  products/                    Store catalog and product details
components/                    Store frame, product cards, and support widget
context/                       Store session, cart, and language contexts
data/products.json             700-item premium product catalog
public/catalog/                 Unique generated SVG cover for every product
scripts/generate-catalog.mjs    Reproducible catalog and cover generator
lib/store-platform.ts          JSON-backed store account and business data
proxy.ts                       Redirects unauthenticated storefront page requests
```

To regenerate all 700 catalog entries and their unique covers, run `npm run catalog:generate`. To run a production build, use `npm run build` followed by `npm start`.

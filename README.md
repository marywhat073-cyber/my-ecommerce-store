# Evergreen Market

A bilingual (English and Burmese) store-selling prototype built with Next.js App Router, React, TypeScript, and Tailwind CSS. Store accounts, product listings, orders, support requests, and wallet actions are persisted server-side in a local JSON file for a single-server demo.

## Start locally

Requirements: Node.js 20.9+ and npm.

```powershell
npm install
npm run dev
```

Create `.env.local` in the project root before registering accounts:

```text
STORE_SESSION_SECRET=<random value of at least 32 characters>
STORE_INVITATION_CODE=<optional private signup invitation code>
CUSTOMER_SERVICE_PHONE=<private staff phone number>
CUSTOMER_SERVICE_PASSWORD=<private staff password>
CUSTOMER_SERVICE_SESSION_SECRET=<different random value of at least 32 characters>
```

Generate random secrets in PowerShell with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Keep `.env.local` private and never use `NEXT_PUBLIC_` for these values. The customer-service portal is intentionally not linked from the storefront; visit `/customer-service-office` and sign in with the configured staff credentials.

## Store workflow

- New visitors must register or sign in before entering product, cart, checkout, or account pages.
- Registration requires phone, store name, address, and a password. A unique Store ID is issued on the server. Passwords are stored as salted scrypt hashes; the original passwords are never returned or shown to staff.
- A signup invitation code matches `STORE_INVITATION_CODE` exactly. Valid codes credit a $30-equivalent bonus (MMK 135,000 at the demo rate of USD 1 = MMK 4,500) to the wallet as locked funds. A successful delivered sale unlocks the bonus.
- Store owners can list products without an upfront charge. Their sale price is calculated at 110% of stated product cost. Customer-service staff confirm delivery; the seller then receives the product cost plus 10% profit in their wallet.
- Store product, cart, and checkout prices display both MMK and approximate USD. The language selector offers only English and Burmese.
- The catalog contains 300 unique product listings across men's clothing, women's clothing, home appliances, kitchenware, and building materials.
- The account page shows store and wallet details, supports no-upfront-cost product listings, and can submit support tickets. Customer-service staff can resolve tickets, verify and record deposits, process withdrawals, and confirm successful deliveries.

## Prototype and deployment limitations

`data/store-platform.json` is created on first write and ignored by Git. It contains store profiles, password hashes, registration IP addresses, wallet balances, products, orders, support tickets, and wallet entries. Keep this file private and backed up. The local JSON file is suitable only for a single persistent server instance; concurrent multi-instance deployment requires a transactional database and shared session infrastructure.

Checkout and wallet entries are demonstrations, not real payment processing. No customer payment is collected, no funds are transferred, and a staff-entered deposit/withdrawal is only a record after external verification. Do not deploy this prototype to hold real funds or sensitive production data. Before launch, replace local JSON storage with a database, add a payment provider and delivery verification, configure trusted proxy IP headers, and apply production monitoring, backups, rate limiting, and account recovery controls.

The signup bonus is stored in the same wallet balance but flagged as locked until a delivered seller order. Staff cannot withdraw the locked bonus. The customer-service interface never exposes password hashes or plaintext passwords.

## Project structure

```text
app/
  account/                     Store dashboard, listings, wallet and support form
  customer-service-office/     Unlinked staff login and support/ledger panel
  api/store/                   Server-side store accounts, products, and orders
  api/customer-service/        Staff authentication and protected operations
  api/support/tickets/         Authenticated support ticket creation
  products/                    Store catalog and product details
components/                    Store frame, product cards, and support widget
context/                       Store session, cart, and language contexts
data/products.json             300-item sample product catalog
lib/store-platform.ts          JSON-backed store account and business data
proxy.ts                       Redirects unauthenticated storefront page requests
```

To run a production build, use `npm run build` followed by `npm start`.

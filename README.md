# Evergreen Market

A responsive, sample-data storefront built with Next.js App Router, React, TypeScript, and Tailwind CSS. The cart and demo account/store/order data are managed in React Context and persisted in the browser's local storage. USD sample prices are also shown in MMK at the fixed demo rate of USD 1 = MMK 4,500; seller-entered listing prices are treated as MMK.

## Requirements

- Node.js 20.9 or newer
- npm (included with Node.js)

## Setup

1. Open a terminal in the project directory.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Visit [http://localhost:3000](http://localhost:3000).

To create and run a production build, use `npm run build` followed by `npm start`.

## Store features

- Home page with product search, category links, featured picks, and a hero banner.
- Product catalog with category and maximum-price filters, text search, and sorting.
- Product pages with an image gallery, quantity selector, and add-to-cart action.
- Persistent cart with quantity controls, removal, a demo promo code (`WELCOME10`), and estimated 8% tax.
- Phone-number account registration/sign-in with an automatically assigned local User ID.
- International phone dial-code selector, six-character password minimum, and five-language UI switcher (English, Myanmar, Thai, Chinese, Spanish).
- Localized storefront, account, seller dashboard, wallet, and customer-service chat across all five languages.
- Product, cart, and checkout prices display USD and the corresponding MMK value at the fixed demo exchange rate.
- Seller registration with a store name, address, and product categories, followed by a browser-local dashboard for product listings and orders.
- Demo wallet deposit details for Wave Money and K Pay are shown on the account page; wallet actions remain simulated. The account page shows the complete local incoming/outgoing history while masking account numbers.
- Deposit and withdrawal requests collect account details and a receipt upload or its last five digits, then notify the administrator through a server-side Telegram bot with bounded retries for temporary Telegram/network failures. Telegram-confirmed requests are persisted as pending admin transactions; only approval changes the server-side demo wallet ledger.
- Admin dashboard at `/admin` provides registered-user, pending-request approval/rejection, and completed transaction history views. Admin credentials and the signed HTTP-only session secret are server-only environment variables. Passwords are never displayed.
- Checkout with Myanmar delivery details, optional consent-based GPS coordinates, and seller-visible order records.
- Demo wallet actions for K Pay and Wave Money, plus a localized customer-service chat widget.

## Demo limitations

Account credentials, listings, wallet balances, transactions, and orders are stored in the current browser. Wallet transactions remain simulated; no actual deposits, withdrawals, or checkout payments occur. Submitting a wallet request sends the account name and number, account holder name, phone, amount, and uploaded receipt (if provided) to the configured Telegram administrator. The current browser-only account is a demo and does not authenticate the submitted user identity. Do not enter wallet PINs or payment passwords.

The admin ledger is a separate local JSON file at `data/admin-store.json` (or `ADMIN_DATA_FILE` if configured). It is intended only for a single persistent local server instance. Registered user profile details are synchronized from the browser-local demo account, so this view is not a trusted identity directory. The admin ledger balance is updated on approved requests; it does not turn the browser-local account system into server-authenticated banking or payment processing. Do not deploy this prototype for real funds or sensitive production data. The user password and any password hash are not included in the admin file or dashboard.

For local admin access, set `ADMIN_PHONE`, `ADMIN_PASSWORD`, and a random `ADMIN_SESSION_SECRET` of at least 32 characters in `.env.local`; `.env.local` is ignored by Git. To enable Telegram notifications, set `TELEGRAM_BOT_TOKEN` using a new, server-only bot credential. The administrator chat ID defaults to `8074618542` and can be overridden with `TELEGRAM_ADMIN_CHAT_ID`. Never commit credentials or expose them through `NEXT_PUBLIC_*` variables. Revoke and replace any bot token shared in chat, logs, or source control.

Before launch, connect a trusted server for authentication, durable user/order data, seller access controls, image storage, delivery workflows, and payment-provider integrations. Enforce authorization and validate all data on the server.

## Project structure

```text
app/
  cart/                  Cart and order summary
  checkout/              Checkout form and confirmation
  api/wallet/            Validated server-side Telegram notifications
  admin/                 Signed-in local admin dashboard
  products/              Catalog and dynamic product details
components/              Shared header, footer, cards, and cart controls
context/                 Cart Context and local-storage persistence
  AppContext.tsx         Browser-local demo accounts, seller listings, orders, and wallet history
app/account/              Phone sign-in, seller dashboard, and demo wallet
lib/admin-store.ts        Local JSON admin user and wallet ledger
data/products.json       Editable sample catalog
lib/                     Product types and formatting helpers
```

Product images are served from Unsplash. Replace the sample URLs in `data/products.json` with your own images as needed. To connect real inventory, shipping, or payments, add a trusted server-side API and payment provider; the included checkout is demonstration-only.

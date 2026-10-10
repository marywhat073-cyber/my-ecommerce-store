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
- Product, cart, and checkout prices display USD and the corresponding MMK value at the fixed demo exchange rate.
- Seller mode with browser-local product listings, cost/selling prices, and uploaded product images.
- Checkout with Myanmar delivery details, optional consent-based GPS coordinates, and seller-visible order records.
- Demo wallet actions labeled K Pay and Wave Pay, plus a fixed-reply customer-service chat widget.

## Demo limitations

This project has no backend. Account credentials, listings, wallet balances, transactions, and orders are only stored in the current browser and are not shared with other devices or sent to sellers. Browser-side password hashing is not production authentication. K Pay and Wave Pay selections only create simulated transactions; no actual deposits, withdrawals, or checkout payments occur. GPS sharing is optional and requires browser permission. Do not enter wallet PINs, payment passwords, or other sensitive payment credentials.

Before launch, connect a trusted server for authentication, durable user/order data, seller access controls, image storage, delivery workflows, and payment-provider integrations. Enforce authorization and validate all data on the server.

## Project structure

```text
app/
  cart/                  Cart and order summary
  checkout/              Checkout form and confirmation
  products/              Catalog and dynamic product details
components/              Shared header, footer, cards, and cart controls
context/                 Cart Context and local-storage persistence
  AppContext.tsx         Demo accounts, seller listings, orders, and wallets
app/account/              Phone sign-in, seller dashboard, and demo wallet
data/products.json       Editable sample catalog
lib/                     Product types and formatting helpers
```

Product images are served from Unsplash. Replace the sample URLs in `data/products.json` with your own images as needed. To connect real inventory, shipping, or payments, add a trusted server-side API and payment provider; the included checkout is demonstration-only.

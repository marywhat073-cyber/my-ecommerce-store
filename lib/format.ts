export const MMK_PER_USD = 4500;

export function getProductCurrency(product: { currency?: "USD" | "MMK"; sellerId?: string }) {
  return product.currency ?? (product.sellerId ? "MMK" : "USD");
}

export function toMMK(price: number, currency: "USD" | "MMK" = "USD") {
  return currency === "USD" ? price * MMK_PER_USD : price;
}

export function formatPrice(price: number) {
  return `MMK ${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(price))}`;
}

export function formatPricePair(price: number, currency: "USD" | "MMK" = "USD") {
  const usd = currency === "USD" ? price : price / MMK_PER_USD;
  const mmk = currency === "MMK" ? price : price * MMK_PER_USD;
  const formattedMMK = `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(mmk))} MMK`;
  return currency === "USD"
    ? `$${usd.toFixed(2)} (~ ${formattedMMK})`
    : `${formattedMMK} (~ $${usd.toFixed(2)})`;
}

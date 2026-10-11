import type { Metadata } from "next";
import { CartProvider } from "@/context/CartContext";
import { AppProvider } from "@/context/AppContext";
import { LocaleProvider } from "@/context/LocaleContext";
import { StoreApplication } from "@/components/StoreApplication";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Evergreen Market — Start and grow your store",
    template: "%s | Evergreen Market",
  },
  description:
    "Register your store, list products without upfront inventory costs, and manage your sales in MMK and USD.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <LocaleProvider>
          <AppProvider>
            <CartProvider>
              <StoreApplication>{children}</StoreApplication>
            </CartProvider>
          </AppProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}

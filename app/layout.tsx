import type { Metadata } from "next";
import { CartProvider } from "@/context/CartContext";
import { AppProvider } from "@/context/AppContext";
import { LocaleProvider } from "@/context/LocaleContext";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { CustomerService } from "@/components/CustomerService";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Evergreen Market — Thoughtful goods for everyday living",
    template: "%s | Evergreen Market",
  },
  description:
    "Discover thoughtfully made home, kitchen, wellness, and everyday essentials at Evergreen Market.",
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
              <SiteHeader />
              <main className="min-h-[60vh]">{children}</main>
              <SiteFooter />
              <CustomerService />
            </CartProvider>
          </AppProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}

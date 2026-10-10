"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, LockKeyhole } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useCart } from "@/context/CartContext";
import { formatPricePair, getProductCurrency, toMMK } from "@/lib/format";
import { useApp } from "@/context/AppContext";
import { useLocale } from "@/context/LocaleContext";

const TAX_RATE = 0.08;

export default function CheckoutPage() {
  const { items, subtotal, hydrated, promoCode, clearCart } = useCart();
  const { user, addOrder } = useApp();
  const { t } = useLocale();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"K Pay" | "Wave Pay">("K Pay");
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const discount = promoCode === "WELCOME10" ? subtotal * 0.1 : 0;
  const tax = (subtotal - discount) * TAX_RATE;
  const total = subtotal - discount + tax;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const sellerIds = [...new Set(items.map(({ product }) => product.sellerId).filter((id): id is string => Boolean(id)))];
    addOrder({
      id: `ORD-${Date.now().toString(36).toUpperCase()}`,
      buyerId: user?.userId,
      sellerIds,
      items: items.map(({ product, quantity }) => ({
        name: product.name,
        quantity,
        sellerId: product.sellerId,
        price: toMMK(product.price, getProductCurrency(product)),
      })),
      total,
      buyerName: `${String(data.get("firstName") ?? "")} ${String(data.get("lastName") ?? "")}`.trim(),
      buyerPhone: String(data.get("phone") ?? ""),
      address: [
        String(data.get("street") ?? ""),
        String(data.get("landmark") ?? ""),
        `${String(data.get("township") ?? "")}, ${String(data.get("city") ?? "")}`,
        String(data.get("region") ?? ""),
        "Myanmar",
      ].filter(Boolean).join("\n"),
      coordinates: coordinates ?? undefined,
      paymentMethod,
      createdAt: new Date().toISOString(),
    });
    setOrderPlaced(true);
    clearCart();
  }

  function captureLocation() {
    setLocationMessage("");
    if (!navigator.geolocation) {
      setLocationMessage(t("checkout.gpsUnavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({ latitude: coords.latitude, longitude: coords.longitude });
        setLocationMessage(t("checkout.gpsAdded"));
      },
      (error) => {
        setLocationMessage(error.code === error.PERMISSION_DENIED
          ? t("checkout.gpsDenied")
          : t("checkout.gpsError"));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  if (!hydrated) return <div className="page-wrap py-20 text-center text-sm text-muted">{t("checkout.loading")}</div>;

  if (orderPlaced) {
    return (
      <div className="page-wrap py-16 md:py-24">
        <div className="mx-auto max-w-lg rounded-2xl bg-white px-7 py-12 text-center shadow-soft">
          <CheckCircle2 size={48} className="mx-auto text-leaf" />
          <p className="eyebrow mt-5">{t("checkout.orderReceived")}</p>
          <h1 className="mt-2 font-display text-3xl">{t("checkout.thankYou")}</h1>
          <p className="mt-4 text-sm leading-6 text-muted">{t("checkout.orderConfirmation")}</p>
          <Link href="/products" className="button-primary mt-7">{t("checkout.backToShop")}</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="page-wrap py-16 text-center">
        <h1 className="font-display text-3xl">{t("checkout.emptyTitle")}</h1>
        <p className="mt-3 text-sm text-muted">{t("checkout.emptyDescription")}</p>
        <Link href="/products" className="button-primary mt-6">{t("checkout.browse")}</Link>
      </div>
    );
  }

  return (
    <div className="page-wrap py-10 md:py-14">
      <Link href="/cart" className="inline-flex items-center gap-2 text-sm text-muted hover:text-forest"><ArrowLeft size={16} /> {t("checkout.backToBag")}</Link>
      <div className="mb-8 mt-5">
        <p className="eyebrow">{t("checkout.eyebrow")}</p>
        <h1 className="section-title mt-2">{t("checkout.title")}</h1>
      </div>
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_390px]">
        <form onSubmit={handleSubmit} className="space-y-8 rounded-xl bg-white p-6 shadow-soft sm:p-8">
          <section>
            <h2 className="font-display text-2xl">{t("checkout.contact")}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">{t("checkout.firstName")}<input name="firstName" required autoComplete="given-name" defaultValue={user?.name.split(" ")[0] ?? ""} className="form-input mt-2 w-full rounded-lg border-black/15" /></label>
              <label className="block text-sm">{t("checkout.lastName")}<input name="lastName" required autoComplete="family-name" defaultValue={user?.name.split(" ").slice(1).join(" ")} className="form-input mt-2 w-full rounded-lg border-black/15" /></label>
              <label className="block text-sm sm:col-span-2">{t("checkout.phone")}<input name="phone" required type="tel" autoComplete="tel" defaultValue={user?.phone ?? ""} className="form-input mt-2 w-full rounded-lg border-black/15" /></label>
            </div>
          </section>
          <section className="border-t border-black/10 pt-7">
            <h2 className="font-display text-2xl">{t("checkout.shipping")}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">{t("checkout.street")}<input name="street" required autoComplete="street-address" className="form-input mt-2 w-full rounded-lg border-black/15" /></label>
              <label className="block text-sm">{t("checkout.township")}<input name="township" required autoComplete="address-level3" className="form-input mt-2 w-full rounded-lg border-black/15" /></label>
              <label className="block text-sm">{t("checkout.city")}<input name="city" required autoComplete="address-level2" className="form-input mt-2 w-full rounded-lg border-black/15" /></label>
              <label className="block text-sm sm:col-span-2">{t("checkout.region")}<input name="region" required autoComplete="address-level1" className="form-input mt-2 w-full rounded-lg border-black/15" /></label>
              <label className="block text-sm sm:col-span-2">{t("checkout.landmark")}<input name="landmark" autoComplete="off" className="form-input mt-2 w-full rounded-lg border-black/15" /></label>
            </div>
            <div className="mt-5 rounded-lg bg-sage/70 p-4">
              <p className="text-sm font-medium">{t("checkout.gpsTitle")}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{t("checkout.gpsDescription")}</p>
              <button type="button" onClick={captureLocation} className="button-secondary mt-3 min-h-10 px-4 text-xs">{t("checkout.useLocation")}</button>
              {coordinates && <p className="mt-2 break-all text-xs text-forest">{t("checkout.coordinates")}: {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}</p>}
              {locationMessage && <p role="status" className="mt-2 text-xs text-muted">{locationMessage}</p>}
            </div>
          </section>
          <section className="border-t border-black/10 pt-7">
            <h2 className="font-display text-2xl">{t("checkout.payment")}</h2>
            <p className="mt-2 text-xs leading-5 text-muted">{t("checkout.paymentDemo")}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(["K Pay", "Wave Pay"] as const).map((method) => (
                <label key={method} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm ${paymentMethod === method ? "border-forest bg-sage/50" : "border-black/15"}`}>
                  <input type="radio" name="paymentMethod" checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} />
                  {method}
                </label>
              ))}
            </div>
          </section>
          <div className="flex items-start gap-2 rounded-lg bg-sage/70 p-4 text-xs leading-5 text-ink/70">
            <LockKeyhole size={16} className="mt-0.5 shrink-0 text-forest" />
            {t("checkout.securityNotice")}
          </div>
          <button type="submit" className="button-primary w-full">{t("checkout.placeOrder")} · {formatPricePair(total, "MMK")}</button>
        </form>
        <aside className="rounded-xl bg-white p-6 shadow-soft">
          <h2 className="font-display text-2xl">{t("checkout.yourOrder")}</h2>
          <div className="mt-5 space-y-4">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex items-center gap-3">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-md bg-sand">
                  <Image src={product.images[0]} alt={product.name} fill unoptimized={Boolean(product.sellerId)} sizes="56px" className="object-cover" />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-forest text-[10px] text-white">{quantity}</span>
                </div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{product.name}</p><p className="text-xs text-muted">{product.category}</p></div>
                <span className="max-w-40 text-right text-xs">{formatPricePair(product.price * quantity, getProductCurrency(product))}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-3 border-t border-black/10 pt-5 text-sm">
            <div className="flex justify-between gap-3"><span className="text-muted">{t("cart.subtotal")}</span><span className="text-right">{formatPricePair(subtotal, "MMK")}</span></div>
            {discount > 0 && <div className="flex justify-between gap-3 text-leaf"><span>{t("cart.discount")}</span><span className="text-right">−{formatPricePair(discount, "MMK")}</span></div>}
            <div className="flex justify-between gap-3"><span className="text-muted">{t("cart.tax")}</span><span className="text-right">{formatPricePair(tax, "MMK")}</span></div>
            <div className="flex justify-between gap-3 border-t border-black/10 pt-4 text-base font-semibold"><span>{t("cart.total")}</span><span className="text-right">{formatPricePair(total, "MMK")}</span></div>
          </div>
          <p className="mt-4 text-xs text-muted">{t("checkout.shippingNote")}</p>
        </aside>
      </div>
    </div>
  );
}

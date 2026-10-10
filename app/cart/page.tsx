"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatPricePair, getProductCurrency } from "@/lib/format";
import { useLocale } from "@/context/LocaleContext";

const TAX_RATE = 0.08;

export default function CartPage() {
  const { items, subtotal, hydrated, promoCode, setPromoCode, updateQuantity, removeItem } = useCart();
  const { t } = useLocale();
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const promoApplied = promoCode === "WELCOME10";
  const discount = promoApplied ? subtotal * 0.1 : 0;
  const tax = (subtotal - discount) * TAX_RATE;
  const total = subtotal - discount + tax;

  function applyPromo() {
    if (promoInput.trim().toUpperCase() === "WELCOME10") {
      setPromoCode("WELCOME10");
      setPromoError("");
    } else {
      setPromoCode("");
      setPromoError("That code didn’t work. Try WELCOME10.");
    }
  }

  if (!hydrated) return <div className="page-wrap py-20 text-center text-sm text-muted">{t("common.loading")}</div>;

  if (items.length === 0) {
    return (
      <div className="page-wrap py-16 md:py-24">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage text-forest"><ShoppingBag size={27} /></div>
          <h1 className="mt-6 font-display text-3xl">{t("cart.emptyTitle")}</h1>
          <p className="mt-3 text-sm leading-6 text-muted">{t("cart.emptyDescription")}</p>
          <Link href="/products" className="button-primary mt-7">{t("cart.explore")} <ArrowRight size={17} /></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap py-10 md:py-14">
      <div className="mb-9">
        <p className="eyebrow">{t("cart.eyebrow")}</p>
        <h1 className="section-title mt-2">{t("cart.title")} <span className="text-muted">({items.reduce((sum, item) => sum + item.quantity, 0)})</span></h1>
      </div>
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_370px]">
        <div className="divide-y divide-black/10 border-y border-black/10">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex gap-4 py-5 sm:gap-6">
              <Link href={`/products/${product.slug}`} className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-sand sm:h-32 sm:w-28">
                <Image src={product.images[0]} alt={product.name} fill unoptimized={Boolean(product.sellerId)} sizes="112px" className="object-cover" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs text-muted">{product.category}</p>
                  <Link href={`/products/${product.slug}`} className="mt-1 block font-medium hover:text-leaf">{product.name}</Link>
                  <p className="mt-2 text-xs leading-5">{formatPricePair(product.price, getProductCurrency(product))}</p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-4 sm:mt-0 sm:flex-col sm:items-end">
                  <div className="inline-flex h-9 items-center rounded-full border border-ink/15 bg-white">
                    <button aria-label={`Decrease ${product.name} quantity`} onClick={() => updateQuantity(product.id, quantity - 1)} className="px-2.5 text-muted hover:text-forest"><Minus size={14} /></button>
                    <span className="w-6 text-center text-xs">{quantity}</span>
                    <button aria-label={`Increase ${product.name} quantity`} onClick={() => updateQuantity(product.id, quantity + 1)} className="px-2.5 text-muted hover:text-forest"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeItem(product.id)} className="inline-flex items-center gap-1 text-xs text-muted hover:text-red-700"><Trash2 size={14} /> {t("cart.remove")}</button>
                </div>
              </div>
              <p className="hidden max-w-40 shrink-0 pt-1 text-right text-xs font-medium sm:block">{formatPricePair(product.price * quantity, getProductCurrency(product))}</p>
            </div>
          ))}
        </div>
        <aside className="rounded-xl bg-white p-6 shadow-soft">
          <h2 className="font-display text-2xl">{t("cart.summary")}</h2>
          <div className="mt-6 flex gap-2">
            <input aria-label={t("cart.promoCode")} value={promoInput} onChange={(event) => setPromoInput(event.target.value)} placeholder={promoApplied ? promoCode : t("cart.promoCode")} className="form-input min-w-0 flex-1 rounded-full border-black/15 text-sm uppercase" />
            <button onClick={applyPromo} disabled={promoApplied} className="button-secondary min-h-11 px-4 text-xs">{t("cart.apply")}</button>
          </div>
          {promoError && <p role="alert" className="mt-2 text-xs text-red-700">{t("cart.promoError")}</p>}
          {promoApplied && <p className="mt-2 text-xs text-leaf">{t("cart.promoApplied")}</p>}
          <div className="mt-6 space-y-3 border-t border-black/10 pt-5 text-sm">
            <div className="flex justify-between gap-3"><span className="text-muted">{t("cart.subtotal")}</span><span className="text-right">{formatPricePair(subtotal, "MMK")}</span></div>
            {promoApplied && <div className="flex justify-between gap-3 text-leaf"><span>{t("cart.discount")}</span><span className="text-right">−{formatPricePair(discount, "MMK")}</span></div>}
            <div className="flex justify-between gap-3"><span className="text-muted">{t("cart.tax")}</span><span className="text-right">{formatPricePair(tax, "MMK")}</span></div>
            <div className="flex justify-between gap-3 border-t border-black/10 pt-4 text-base font-semibold"><span>{t("cart.total")}</span><span className="text-right">{formatPricePair(total, "MMK")}</span></div>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted">{t("cart.deliveryNote")}</p>
          <Link href="/checkout" className="button-primary mt-6 w-full">{t("cart.checkout")} <ArrowRight size={17} /></Link>
          <Link href="/products" className="mt-4 block text-center text-sm text-muted hover:text-forest">{t("cart.continueShopping")}</Link>
        </aside>
      </div>
    </div>
  );
}

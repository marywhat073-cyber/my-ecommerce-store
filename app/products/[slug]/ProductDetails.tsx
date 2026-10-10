"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight, Star } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { formatPricePair, getProductCurrency } from "@/lib/format";
import type { Product } from "@/lib/products";
import { useLocale } from "@/context/LocaleContext";
import { ProductPurchase } from "./purchase";

export function ProductDetails({
  product,
  related,
}: {
  product: Product;
  related: Product[];
}) {
  const { t } = useLocale();

  return (
    <div className="page-wrap py-7 md:py-10">
      <nav aria-label={t("product.breadcrumb")} className="mb-7 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:text-forest">{t("product.home")}</Link><ChevronRight size={14} />
        <Link href="/products" className="hover:text-forest">{t("product.shop")}</Link><ChevronRight size={14} />
        <span className="text-ink">{product.name}</span>
      </nav>
      <div className="grid gap-9 lg:grid-cols-2 lg:gap-14">
        <div className="grid gap-3 sm:grid-cols-2">
          {product.images.map((image, index) => (
            <div key={image} className={`relative aspect-[4/5] overflow-hidden rounded-xl bg-sand ${index === 0 ? "sm:col-span-2" : "hidden sm:block"}`}>
              <Image src={image} alt={`${product.name}, view ${index + 1}`} fill priority={index === 0} sizes={index === 0 ? "(max-width: 640px) 100vw, 50vw" : "25vw"} className="object-cover" />
            </div>
          ))}
        </div>
        <div className="py-1 lg:py-5">
          <p className="eyebrow">{t(`category.${product.category}`)}</p>
          <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">{product.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-lg font-medium">{formatPricePair(product.price, getProductCurrency(product))}</span>
            {product.compareAtPrice && <span className="text-sm text-muted line-through">{formatPricePair(product.compareAtPrice, getProductCurrency(product))}</span>}
            <span className="flex items-center gap-1 border-l border-black/15 pl-3 text-sm text-muted"><Star size={14} className="fill-amber-500 text-amber-500" /> {product.rating} · {product.reviewCount} {t("product.reviews")}</span>
          </div>
          <p className="mt-6 text-sm leading-7 text-ink/75">{product.description}</p>
          <ul className="mt-5 space-y-2.5">
            {product.details.map((detail) => <li key={detail} className="flex items-start gap-2 text-sm text-ink/75"><Check size={16} className="mt-0.5 shrink-0 text-leaf" />{detail}</li>)}
          </ul>
          <ProductPurchase product={product} />
          <div className="mt-6 space-y-3 border-t border-black/10 pt-5 text-xs leading-5 text-muted">
            <p>{t("product.delivery")}</p>
            <p>{t("product.packaging")}</p>
            <p>{t("product.returns")}</p>
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-16 border-t border-black/10 pt-12">
          <p className="eyebrow">{t("product.together")}</p>
          <h2 className="section-title mt-2">{t("product.moreFrom")} {t(`category.${product.category}`).toLowerCase()}</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3">
            {related.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </section>
      )}
    </div>
  );
}

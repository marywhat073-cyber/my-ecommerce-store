"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { ProductPurchase } from "@/app/products/[slug]/purchase";
import { formatPricePair } from "@/lib/format";

export function SellerProductPage() {
  const params = useParams<{ slug: string }>();
  const { sellerProducts, hydrated } = useApp();
  const product = sellerProducts.find((item) => item.slug === params.slug);

  if (!hydrated) return <div className="page-wrap py-20 text-center text-sm text-muted">Loading product…</div>;
  if (!product) {
    return (
      <div className="page-wrap py-20 text-center">
        <h1 className="font-display text-3xl">We couldn’t find that product.</h1>
        <Link href="/products" className="button-primary mt-6">Browse the catalog</Link>
      </div>
    );
  }

  return (
    <div className="page-wrap py-10">
      <Link href="/products" className="text-sm text-muted hover:text-forest">← Back to catalog</Link>
      <div className="mt-6 grid gap-9 lg:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-sand">
          <Image src={product.images[0]} alt={product.name} fill unoptimized sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
        </div>
        <section className="py-3">
          <p className="eyebrow">{product.category} · Own Store</p>
          <h1 className="mt-2 font-display text-4xl">{product.name}</h1>
          <p className="mt-4 text-lg font-medium">{formatPricePair(product.price, product.currency ?? "MMK")}</p>
          <p className="mt-6 whitespace-pre-line text-sm leading-7 text-ink/75">{product.description}</p>
          <ProductPurchase product={product} />
          <p className="mt-6 border-t border-black/10 pt-5 text-xs leading-5 text-muted">Listed by an independent Evergreen seller. Delivery details are collected at checkout.</p>
        </section>
      </div>
    </div>
  );
}

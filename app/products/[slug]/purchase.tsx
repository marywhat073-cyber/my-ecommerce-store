"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/products";
import { AddToCartButton } from "@/components/AddToCartButton";
import { useLocale } from "@/context/LocaleContext";

export function ProductPurchase({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const { t } = useLocale();

  return (
    <div className="mt-7">
      <p className="mb-2 text-sm font-medium">{t("product.quantity")}</p>
      <div className="mb-5 inline-flex h-11 items-center rounded-full border border-ink/15 bg-white">
        <button aria-label="Decrease quantity" onClick={() => setQuantity((current) => Math.max(1, current - 1))} className="px-3 text-muted hover:text-forest"><Minus size={16} /></button>
        <span aria-live="polite" className="w-8 text-center text-sm">{quantity}</span>
        <button aria-label="Increase quantity" onClick={() => setQuantity((current) => current + 1)} className="px-3 text-muted hover:text-forest"><Plus size={16} /></button>
      </div>
      <AddToCartButton product={product} quantity={quantity} />
    </div>
  );
}

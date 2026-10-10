"use client";

import { Check, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/lib/products";
import { useLocale } from "@/context/LocaleContext";

export function AddToCartButton({
  product,
  quantity = 1,
}: {
  product: Product;
  quantity?: number;
}) {
  const { addItem } = useCart();
  const { t } = useLocale();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <button onClick={handleAdd} className="button-primary w-full">
      {added ? <Check size={18} /> : <ShoppingBag size={18} />}
      {added ? t("product.addedToBag") : t("product.addToBag")}
    </button>
  );
}

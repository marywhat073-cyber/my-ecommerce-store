"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { categories, products } from "@/lib/products";
import { useApp } from "@/context/AppContext";
import { getProductCurrency, toMMK } from "@/lib/format";
import { useLocale } from "@/context/LocaleContext";

const MAX_PRICE = "1000000";

export function ProductCatalog({
  initialCategory,
  initialQuery,
}: {
  initialCategory: string;
  initialQuery: string;
}) {
  const [category, setCategory] = useState(initialCategory);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [sort, setSort] = useState("featured");
  const [search, setSearch] = useState(initialQuery);
  const { sellerProducts } = useApp();
  const { t } = useLocale();

  const filteredProducts = useMemo(() => {
    const allProducts = [...sellerProducts, ...products];
    const visible = allProducts.filter((product) => {
      const matchesCategory = category === "All" || product.category === category;
      const matchesPrice = toMMK(product.price, getProductCurrency(product)) <= Number(maxPrice);
      const matchesSearch = `${product.name} ${product.category} ${product.description}`
        .toLowerCase()
        .includes(search.trim().toLowerCase());
      return matchesCategory && matchesPrice && matchesSearch;
    });

    return [...visible].sort((a, b) => {
      if (sort === "price-low") return toMMK(a.price, getProductCurrency(a)) - toMMK(b.price, getProductCurrency(b));
      if (sort === "price-high") return toMMK(b.price, getProductCurrency(b)) - toMMK(a.price, getProductCurrency(a));
      if (sort === "rating") return b.rating - a.rating;
      return allProducts.indexOf(a) - allProducts.indexOf(b);
    });
  }, [category, maxPrice, search, sort, sellerProducts]);

  return (
    <div className="page-wrap py-10 md:py-14">
      <div className="mb-9 border-b border-ink/10 pb-8">
        <p className="eyebrow">{t("catalog.eyebrow")}</p>
        <h1 className="section-title mt-2">{t("catalog.title")}</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted">{t("catalog.subtitle")}</p>
      </div>
      <div className="grid gap-8 md:grid-cols-[210px_1fr]">
        <aside className="space-y-7">
          <label className="block">
            <span className="mb-3 flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal size={16} /> {t("catalog.category")}</span>
            <select className="form-select w-full rounded-lg border-black/15 bg-white text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="All">{t("catalog.allCategories")}</option>
              {categories.map((item) => <option key={item.name} value={item.name}>{t(`category.${item.name}`)}</option>)}
              <option value="Stationery">{t("category.Stationery")}</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-3 flex items-center justify-between text-sm font-semibold">{t("catalog.maxPrice")} <span className="font-normal text-muted">{`MMK ${Number(maxPrice).toLocaleString()}`}</span></span>
            <input aria-label={t("catalog.maxPrice")} type="range" min="0" max={MAX_PRICE} step="1" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} className="w-full accent-forest" />
            <span className="mt-1 flex justify-between text-xs text-muted"><span>MMK 10</span><span>MMK 1,000,000</span></span>
          </label>
          <label className="block">
            <span className="mb-3 block text-sm font-semibold">{t("catalog.search")}</span>
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("catalog.searchPlaceholder")} className="form-input w-full rounded-lg border-black/15 bg-white text-sm" />
          </label>
          <button onClick={() => { setCategory("All"); setMaxPrice(MAX_PRICE); setSort("featured"); setSearch(""); }} className="text-sm text-muted underline underline-offset-4 hover:text-forest">{t("catalog.clear")}</button>
        </aside>
        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">{filteredProducts.length} {t(filteredProducts.length === 1 ? "catalog.piece" : "catalog.pieces")}</p>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted">{t("catalog.sort")}</span>
            <select aria-label={t("catalog.sort")} className="form-select rounded-lg border-black/15 bg-white py-2 text-sm" value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="featured">{t("catalog.featured")}</option>
              <option value="price-low">{t("catalog.priceLow")}</option>
              <option value="price-high">{t("catalog.priceHigh")}</option>
              <option value="rating">{t("catalog.topRated")}</option>
              </select>
            </label>
          </div>
          {filteredProducts.length ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3">
              {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="rounded-xl bg-white px-6 py-16 text-center">
              <h2 className="font-display text-2xl">{t("catalog.emptyTitle")}</h2>
              <p className="mt-2 text-sm text-muted">{t("catalog.emptyText")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

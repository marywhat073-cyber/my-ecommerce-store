"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { MINIMUM_PRODUCT_PRICE_MMK, productCategories, products } from "@/lib/products";
import { useApp } from "@/context/AppContext";
import { getProductCurrency, MMK_PER_USD, toMMK } from "@/lib/format";
import { useLocale } from "@/context/LocaleContext";

const MAX_PRICE = "60000000";
const PAGE_SIZE = 24;

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
  const [page, setPage] = useState(1);
  const { sellerProducts } = useApp();
  const { t } = useLocale();

  const filteredProducts = useMemo(() => {
    const allProducts = [...sellerProducts, ...products];
    const visible = allProducts.filter((product) => {
      const matchesCategory = category === "All" || product.category === category;
      const priceMMK = toMMK(product.price, getProductCurrency(product));
      const matchesPrice = priceMMK >= MINIMUM_PRODUCT_PRICE_MMK && priceMMK <= Number(maxPrice);
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
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const firstResult = filteredProducts.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const lastResult = Math.min(currentPage * PAGE_SIZE, filteredProducts.length);

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
            <select className="form-select w-full rounded-lg border-black/15 bg-white text-sm" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}>
              <option value="All">{t("catalog.allCategories")}</option>
              {productCategories.map((categoryName) => <option key={categoryName} value={categoryName}>{t(`category.${categoryName}`)}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-3 flex items-center justify-between text-sm font-semibold">{t("catalog.maxPrice")} <span className="font-normal text-muted">{`$${(Number(maxPrice) / MMK_PER_USD).toFixed(2)} (~ MMK ${Number(maxPrice).toLocaleString()})`}</span></span>
            <input aria-label={t("catalog.maxPrice")} type="range" min={String(MINIMUM_PRODUCT_PRICE_MMK)} max={MAX_PRICE} step="100000" value={maxPrice} onChange={(event) => { setMaxPrice(event.target.value); setPage(1); }} className="w-full accent-forest" />
            <span className="mt-1 flex justify-between text-xs text-muted"><span>$66.67 (~ MMK 300,000)</span><span>$13,333.33 (~ MMK 60,000,000)</span></span>
          </label>
          <label className="block">
            <span className="mb-3 block text-sm font-semibold">{t("catalog.search")}</span>
            <input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={t("catalog.searchPlaceholder")} className="form-input w-full rounded-lg border-black/15 bg-white text-sm" />
          </label>
          <button onClick={() => { setCategory("All"); setMaxPrice(MAX_PRICE); setSort("featured"); setSearch(""); setPage(1); }} className="text-sm text-muted underline underline-offset-4 hover:text-forest">{t("catalog.clear")}</button>
        </aside>
        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">{t("catalog.showing").replace("{start}", String(firstResult)).replace("{end}", String(lastResult)).replace("{count}", String(filteredProducts.length))}</p>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted">{t("catalog.sort")}</span>
            <select aria-label={t("catalog.sort")} className="form-select rounded-lg border-black/15 bg-white py-2 text-sm" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
                <option value="featured">{t("catalog.featured")}</option>
              <option value="price-low">{t("catalog.priceLow")}</option>
              <option value="price-high">{t("catalog.priceHigh")}</option>
              <option value="rating">{t("catalog.topRated")}</option>
              </select>
            </label>
          </div>
          {filteredProducts.length ? (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3">
                {pageProducts.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
              {pageCount > 1 && <nav aria-label={t("catalog.pagination")} className="mt-10 flex items-center justify-center gap-4">
                <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="button-secondary disabled:cursor-not-allowed disabled:opacity-50">{t("catalog.previousPage")}</button>
                <span aria-live="polite" className="text-sm text-muted">{currentPage} / {pageCount}</span>
                <button type="button" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="button-secondary disabled:cursor-not-allowed disabled:opacity-50">{t("catalog.nextPage")}</button>
              </nav>}
            </>
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

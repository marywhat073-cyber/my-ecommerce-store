"use client";

import Link from "next/link";
import { Search, ShoppingBag, Sprout, Store, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useApp } from "@/context/AppContext";
import { languages, useLocale } from "@/context/LocaleContext";

export function SiteHeader() {
  const { itemCount } = useCart();
  const { user } = useApp();
  const { language, setLanguage, t } = useLocale();
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(`/products${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-cream/95 backdrop-blur">
      <div className="bg-forest px-4 py-2 text-center text-xs tracking-wide text-white">
        {t("nav.announcement")}
      </div>
      <div className="page-wrap flex h-[76px] items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-forest">
          <Sprout size={27} strokeWidth={1.7} />
          <span className="font-display text-[22px] tracking-tight">evergreen</span>
        </Link>
        <nav className="hidden items-center gap-3 text-xs font-medium text-ink/80 lg:flex lg:gap-5 lg:text-sm">
          <Link href="/products" className="hover:text-leaf">{t("nav.shop")}</Link>
          <Link href="/products?category=Home" className="hover:text-leaf">{t("nav.home")}</Link>
          <Link href="/products?category=Kitchen" className="hover:text-leaf">{t("nav.kitchen")}</Link>
          <Link href="/products?category=Wellness" className="hover:text-leaf">{t("nav.wellness")}</Link>
          <Link href="/account" className="inline-flex items-center gap-1 rounded-full bg-sage px-3 py-2 text-xs font-semibold text-forest hover:bg-sage/70">
            <Store size={15} />
            {user?.store ? t("nav.sellerDashboard") : t("nav.sellerAccount")}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="hidden items-center border-b border-ink/20 pb-1 sm:flex">
            <input
              aria-label={t("nav.searchProducts")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("nav.search")}
              className="w-28 border-0 bg-transparent p-1 text-sm placeholder:text-muted focus:ring-0 lg:w-36"
            />
            <button aria-label={t("nav.submitSearch")} className="text-muted hover:text-forest">
              <Search size={18} />
            </button>
          </form>
          <Link href="/account" aria-label={`${t("nav.signedInAccount")}${user ? ` ${user.userId}` : ""}`} className="inline-flex items-center gap-1 rounded-full p-2 text-sm hover:bg-sage">
            <UserRound size={20} strokeWidth={1.7} />
            <span className="hidden lg:inline">{user ? user.userId : t("nav.account")}</span>
          </Link>
          <label className="sr-only" htmlFor="site-language">{t("nav.language")}</label>
          <select id="site-language" aria-label={t("nav.language")} value={language} onChange={(event) => setLanguage(event.target.value as typeof language)} className="form-select max-w-[112px] rounded-full border-black/15 bg-transparent py-2 pl-3 pr-7 text-xs">
            {languages.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
          </select>
          <Link href="/cart" aria-label={`${t("nav.shoppingBag")}, ${itemCount}`} className="relative rounded-full p-2 hover:bg-sage">
            <ShoppingBag size={21} strokeWidth={1.7} />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-forest px-1 text-[10px] font-semibold text-white">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-black/5 px-4 py-2 text-xs lg:hidden">
        <Link href="/products">{t("nav.shop")}</Link>
        <Link href="/products?category=Home">{t("nav.home")}</Link>
        <Link href="/products?category=Kitchen">{t("nav.kitchen")}</Link>
        <Link href="/products?category=Wellness">{t("nav.wellness")}</Link>
        <Link href="/account" className="inline-flex items-center gap-1 font-semibold text-forest">
          <Store size={14} />
          {user?.store ? t("nav.sellerDashboard") : t("nav.sellerAccount")}
        </Link>
      </div>
      <form onSubmit={handleSearch} className="flex items-center border-t border-black/5 px-5 py-2 sm:hidden">
        <input
          aria-label={t("nav.searchProducts")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("nav.search")}
          className="w-full border-0 bg-transparent p-1 text-sm placeholder:text-muted focus:ring-0"
        />
        <button aria-label={t("nav.submitSearch")} className="text-muted hover:text-forest">
          <Search size={18} />
        </button>
      </form>
    </header>
  );
}

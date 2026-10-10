"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MoveRight } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { categories, products } from "@/lib/products";
import { useLocale } from "@/context/LocaleContext";

export default function HomePage() {
  const { t } = useLocale();
  return (
    <>
      <section className="page-wrap pb-12 pt-7 md:pb-20 md:pt-10">
        <div className="relative min-h-[500px] overflow-hidden rounded-2xl bg-[#e8e6dc] md:min-h-[570px]">
          <Image
            src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=2000&q=90"
            alt="Warm, natural textures in a calm living room"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1d2923]/75 via-[#1d2923]/30 to-transparent" />
          <div className="relative flex min-h-[500px] max-w-xl flex-col items-start justify-center px-7 py-12 text-white sm:px-12 md:min-h-[570px] md:px-16">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">{t("home.heroEyebrow")}</p>
            <h1 className="mt-5 font-display text-5xl leading-[1.07] tracking-tight sm:text-6xl">{t("home.heroTitle")}</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-white/85">{t("home.heroText")}</p>
            <Link href="/products" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-forest transition hover:bg-sage">
              {t("home.explore")} <ArrowRight size={17} />
            </Link>
          </div>
          <div className="absolute bottom-5 right-6 hidden rounded-full bg-white/90 px-4 py-2 text-xs text-forest sm:block">Considered goods · Everyday prices</div>
        </div>
      </section>

      <section className="page-wrap py-10 md:py-14">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <p className="eyebrow">Find your kind of good</p>
            <h2 className="section-title mt-2">{t("home.categoryTitle")}</h2>
          </div>
          <Link href="/products" className="hidden items-center gap-2 text-sm font-medium text-forest hover:text-leaf sm:flex">{t("home.shopAll")} <MoveRight size={17} /></Link>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.name} href={`/products?category=${encodeURIComponent(category.name)}`} className="group relative aspect-[5/4] overflow-hidden rounded-xl bg-sand">
              <Image src={category.image} alt={`${category.name} collection`} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 font-display text-xl text-white sm:bottom-5 sm:left-5 sm:text-2xl">
                {category.name} <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-wrap py-12 md:py-16">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <p className="eyebrow">A few good favorites</p>
            <h2 className="section-title mt-2">{t("home.favoritesTitle")}</h2>
          </div>
          <Link href="/products" className="flex items-center gap-2 text-sm font-medium text-forest hover:text-leaf">{t("home.shopAll")} <MoveRight size={17} /></Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
          {products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      <section className="page-wrap py-8 md:py-14">
        <div className="grid items-center gap-8 rounded-2xl bg-sage p-7 sm:p-10 md:grid-cols-2 md:gap-12 md:p-14">
          <div>
            <p className="eyebrow">Better things, made better</p>
            <h2 className="mt-3 max-w-md font-display text-3xl leading-tight sm:text-4xl">{t("home.careTitle")}</h2>
          </div>
          <div>
            <p className="max-w-lg text-sm leading-7 text-ink/75">
              We believe the things we use every day should feel good, work hard, and tread lightly. That means natural materials, independent makers, and pieces designed to live with you for years.
            </p>
            <Link href="/products" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-forest">{t("home.getCollection")} <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>
    </>
  );
}

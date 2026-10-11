"use client";

import Link from "next/link";
import { Sprout } from "lucide-react";
import { useLocale } from "@/context/LocaleContext";

export function SiteFooter() {
  const { t } = useLocale();
  return (
    <footer className="mt-20 bg-forest text-white">
      <div className="page-wrap grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <Link href="/" className="flex items-center gap-2">
            <Sprout size={25} />
            <span className="font-display text-xl">evergreen</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/70">{t("footer.description")}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold">{t("footer.explore")}</h2>
          <div className="mt-4 grid gap-3 text-sm text-white/70">
            <Link href="/products">{t("footer.shopAll")}</Link>
            <Link href="/products?category=Home%20Appliances">{t("footer.homeAppliances")}</Link>
            <Link href="/products?category=Building%20Materials">{t("footer.buildingMaterials")}</Link>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold">{t("footer.note")}</h2>
          <p className="mt-4 text-sm leading-6 text-white/70">{t("footer.noteText")}</p>
        </div>
      </div>
      <div className="border-t border-white/15 py-4 text-center text-xs text-white/55">
        © {new Date().getFullYear()} {t("footer.copyright")}
      </div>
    </footer>
  );
}

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
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/70">
            Everyday things, chosen with care. Thoughtful design, natural materials, and a little more meaning in the things we keep.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold">{t("footer.explore")}</h2>
          <div className="mt-4 grid gap-3 text-sm text-white/70">
            <Link href="/products">Shop all</Link>
            <Link href="/products?category=Home">Home & living</Link>
            <Link href="/products?category=Wellness">Wellness</Link>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold">{t("footer.note")}</h2>
          <p className="mt-4 text-sm leading-6 text-white/70">Good things take time. We make and source in small batches, with care at every step.</p>
        </div>
      </div>
      <div className="border-t border-white/15 py-4 text-center text-xs text-white/55">
        © {new Date().getFullYear()} Evergreen Market. Made for living well.
      </div>
    </footer>
  );
}

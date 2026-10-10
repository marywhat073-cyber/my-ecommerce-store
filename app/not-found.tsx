"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";

export default function NotFound() {
  const { t } = useLocale();

  return (
    <div className="page-wrap py-24 text-center">
      <p className="eyebrow">{t("notFound.eyebrow")}</p>
      <h1 className="mt-3 font-display text-4xl">{t("notFound.title")}</h1>
      <p className="mt-4 text-sm text-muted">{t("notFound.description")}</p>
      <Link href="/products" className="button-primary mt-7">{t("notFound.browse")}</Link>
    </div>
  );
}

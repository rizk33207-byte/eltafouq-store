"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/lib/i18n";

export default function ProductNotFound() {
  const locale = useLocale() as Locale;
  const t = useTranslations("ProductNotFound");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-16 text-center sm:px-6">
      <span className="inline-flex rounded-full border border-sky-300/25 bg-sky-400/12 px-3 py-1 text-xs font-semibold text-sky-300">
        {t("badge")}
      </span>
      <h1 className="mt-4 text-3xl font-extrabold text-ink">{t("title")}</h1>
      <p className="mt-3 max-w-xl text-ink-soft">{t("description")}</p>
      <Link
        href={`/${locale}/books`}
        className="focus-visible-ring mt-6 rounded-xl bg-linear-to-l from-brand to-brand-strong px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.02]"
      >
        {t("backToBooks")}
      </Link>
    </main>
  );
}

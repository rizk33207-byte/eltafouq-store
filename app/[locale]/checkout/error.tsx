"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";
import type { Locale } from "@/lib/i18n";

interface CheckoutErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CheckoutError({ error, reset }: CheckoutErrorProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("Errors");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-16 text-center sm:px-6">
      <div className="glass-panel w-full rounded-3xl p-8 sm:p-12">
        <h1 className="text-3xl font-extrabold text-ink">{t("checkoutTitle")}</h1>
        <p className="mt-3 text-ink-soft">{t("checkoutDescription")}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="focus-visible-ring rounded-xl bg-linear-to-l from-brand to-brand-strong px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.02]"
          >
            {t("tryAgain")}
          </button>
          <Link
            href={`/${locale}`}
            className="focus-visible-ring rounded-xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-white/15"
          >
            {t("backHome")}
          </Link>
        </div>
      </div>
    </main>
  );
}

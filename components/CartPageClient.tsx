"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/lib/cart-store";
import type { Locale } from "@/lib/i18n";
import { formatPriceEGP } from "@/lib/utils";
import { getCartWhatsAppLink } from "@/lib/whatsapp";

interface CartPageClientProps {
  locale: Locale;
}

export default function CartPageClient({ locale }: CartPageClientProps) {
  const t = useTranslations("Cart");
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const remove = useCartStore((state) => state.remove);
  const inc = useCartStore((state) => state.inc);
  const dec = useCartStore((state) => state.dec);
  const total = useCartStore((state) => state.total());
  const count = useCartStore((state) => state.count());

  const checkoutLink = useMemo(
    () => getCartWhatsAppLink(items, total, locale),
    [items, total, locale],
  );

  if (items.length === 0) {
    return (
      <main className="page-enter mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-16 text-center sm:px-6">
        <div className="glass-panel w-full rounded-3xl p-8 sm:p-12">
          <h1 className="text-3xl font-extrabold text-ink">{t("emptyTitle")}</h1>
          <p className="mt-3 text-ink-soft">{t("emptyDescription")}</p>
          <Link
            href={`/${locale}/books`}
            className="focus-visible-ring mt-6 inline-flex rounded-xl bg-linear-to-l from-brand to-brand-strong px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.02]"
          >
            {t("browseBooks")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-enter mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-ink">{t("title")}</h1>
        <p className="mt-2 text-ink-soft">{t("subtitle")}</p>
        <p className="mt-2 text-sm text-sky-300">{t("itemsCount", { count })}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="space-y-4">
          {items.map((item) => {
            const subtotal = item.price * item.qty;

            return (
              <article
                key={item.id}
                className="glass-panel soft-card-hover flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center"
              >
                <div className="relative h-24 w-20 overflow-hidden rounded-xl border border-white/10 bg-[#0d1434]/70">
                  <Image
                    src={item.image ?? "/images/book-placeholder.svg"}
                    alt={item.title}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>

                <div className="flex-1">
                  <h2 className="text-base font-bold text-ink">{item.title}</h2>
                  <p className="mt-1 text-sm text-ink-soft">{formatPriceEGP(item.price, locale)}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-ink-soft">{t("qty")}</span>
                  <div className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-2 py-1">
                    <button
                      type="button"
                      onClick={() => dec(item.id)}
                      className="focus-visible-ring inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-ink transition-colors hover:bg-white/18"
                    >
                      -
                    </button>
                    <span className="min-w-6 text-center text-sm font-semibold text-ink">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => inc(item.id)}
                      className="focus-visible-ring inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-ink transition-colors hover:bg-white/18"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-sm font-semibold text-ink">
                  {t("subtotal")}: {formatPriceEGP(subtotal, locale)}
                </div>

                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="focus-visible-ring rounded-lg border border-rose-300/30 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-500/25"
                >
                  {t("remove")}
                </button>
              </article>
            );
          })}
        </section>

        <aside className="glass-panel h-fit rounded-2xl p-5">
          <h2 className="text-lg font-bold text-ink">{t("title")}</h2>
          <div className="mt-4 flex items-center justify-between text-sm text-ink-soft">
            <span>{t("itemsCount", { count })}</span>
          </div>
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="text-base font-semibold text-ink">
              {t("total")}: <span className="text-cyan-300">{formatPriceEGP(total, locale)}</span>
            </p>
          </div>

          <div className="mt-5 grid gap-2">
            <Link
              href={`/${locale}/checkout`}
              className="focus-visible-ring inline-flex items-center justify-center rounded-xl bg-linear-to-l from-brand to-brand-strong px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.01]"
            >
              {t("continueCheckout")}
            </Link>
            <button
              type="button"
              onClick={clear}
              className="focus-visible-ring rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-white/14"
            >
              {t("clear")}
            </button>
            <a
              href={checkoutLink}
              target="_blank"
              rel="noreferrer noopener"
              className="focus-visible-ring inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01] hover:bg-emerald-400"
            >
              {t("quickOrderWhatsApp")}
            </a>
            <Link
              href={`/${locale}/books`}
              className="focus-visible-ring inline-flex items-center justify-center rounded-xl bg-linear-to-l from-brand to-brand-strong px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.01]"
            >
              {t("backToBooks")}
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}


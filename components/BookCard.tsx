"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Book } from "@/lib/types";
import { useCartStore } from "@/lib/cart-store";
import type { Locale } from "@/lib/i18n";
import {
  cn,
  formatPriceEGP,
  getGradeLabel,
  getLanguageLabel,
  getSubjectLabel,
} from "@/lib/utils";
import { getBookWhatsAppLink } from "@/lib/whatsapp";

interface BookCardProps {
  book: Book;
  contextQuery?: string;
}

export default function BookCard({ book, contextQuery }: BookCardProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("BookCard");
  const addToCart = useCartStore((state) => state.add);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAdded(false);
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [added]);

  const detailsHref = contextQuery
    ? `/${locale}/product/${book.id}?${contextQuery}`
    : `/${locale}/product/${book.id}`;

  const handleAddToCart = () => {
    addToCart(
      {
        id: book.id,
        title: book.title,
        price: book.price,
        image: book.image,
      },
      1,
    );
    setAdded(true);
  };

  return (
    <article className="soft-card-hover glass-panel group flex h-full flex-col overflow-hidden rounded-2xl">
      <div className="relative aspect-4/5 w-full overflow-hidden bg-muted">
        <Image
          src={book.image}
          alt={book.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#050916]/85 via-transparent to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full border border-sky-300/20 bg-sky-400/12 px-2 py-1 text-sky-300">
            {getGradeLabel(book.grade, locale)}
          </span>
          <span className="rounded-full border border-violet-300/20 bg-violet-400/14 px-2 py-1 text-violet-300">
            {getLanguageLabel(book.language, locale)}
          </span>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/14 px-2 py-1 text-emerald-300">
            {getSubjectLabel(book.subject, locale)}
          </span>
        </div>

        <h3 className="mb-2 text-base font-bold leading-7 text-ink">{book.title}</h3>
        <p className="mb-4 text-sm text-ink-soft">{formatPriceEGP(book.price, locale)}</p>

        <div className="mt-auto flex flex-col gap-2">
          <Link
            href={detailsHref}
            className="focus-visible-ring inline-flex items-center justify-center rounded-xl bg-linear-to-l from-brand to-brand-strong px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02]"
          >
            {t("viewDetails")}
          </Link>
          <a
            href={getBookWhatsAppLink(book, locale)}
            target="_blank"
            rel="noreferrer noopener"
            className="focus-visible-ring inline-flex items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-500/14 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-500/25"
          >
            {t("orderWhatsApp")}
          </a>
          <button
            type="button"
            onClick={handleAddToCart}
            className={cn(
              "focus-visible-ring inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-[1.02]",
              added
                ? "border-sky-300/40 bg-sky-400/22 text-sky-200 shadow-[0_0_24px_rgba(61,132,255,0.33)]"
                : "border-white/20 bg-white/8 text-ink hover:bg-white/15",
            )}
          >
            {added ? t("added") : t("addToCart")}
          </button>
        </div>
      </div>
    </article>
  );
}


"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/lib/cart-store";
import type { Locale } from "@/lib/i18n";
import type { Book } from "@/lib/types";
import { getBookWhatsAppLink } from "@/lib/whatsapp";

interface ProductActionsProps {
  book: Book;
  locale: Locale;
  backHref: string;
}

export default function ProductActions({
  book,
  locale,
  backHref,
}: ProductActionsProps) {
  const t = useTranslations("ProductPage");
  const router = useRouter();
  const addToCart = useCartStore((state) => state.add);

  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [added, setAdded] = useState(false);

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
    window.setTimeout(() => setAdded(false), 1100);
  };

  const handleBuyNow = () => {
    if (isBuyingNow) {
      return;
    }

    setIsBuyingNow(true);
    router.push(`/${locale}/checkout?buyNow=${encodeURIComponent(book.id)}&qty=1`);
  };

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        onClick={handleBuyNow}
        className="focus-visible-ring inline-flex items-center justify-center rounded-xl bg-linear-to-l from-brand to-brand-strong px-5 py-3 text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02]"
      >
        {isBuyingNow ? t("buyNowLoading") : t("buyNow")}
      </button>

      <a
        href={getBookWhatsAppLink(book, locale)}
        target="_blank"
        rel="noreferrer noopener"
        className="focus-visible-ring inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-400"
      >
        {t("orderWhatsApp")}
      </a>

      <button
        type="button"
        onClick={handleAddToCart}
        className="focus-visible-ring inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-bold text-ink transition-colors hover:bg-white/15"
      >
        {added ? t("addedToCart") : t("addToCart")}
      </button>

      <Link
        href={backHref}
        className="focus-visible-ring inline-flex items-center justify-center rounded-xl border border-sky-300/30 bg-sky-400/10 px-5 py-3 text-sm font-bold text-sky-300 transition-colors hover:bg-sky-400/18"
      >
        {t("backToResults")}
      </Link>
    </div>
  );
}


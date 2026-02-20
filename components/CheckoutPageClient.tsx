"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/lib/cart-store";
import { createOrderRequest, OrderApiError } from "@/lib/orders";
import type { Locale } from "@/lib/i18n";
import type { Book } from "@/lib/types";
import { formatPriceEGP } from "@/lib/utils";
import {
  buildPlacedOrderLink,
  type CheckoutCustomerInfo,
} from "@/lib/whatsapp";

interface CheckoutPageClientProps {
  locale: Locale;
  buyNowBookId: string | null;
  buyNowBook: Book | null;
  buyNowQty: number;
}

type CheckoutFormState = CheckoutCustomerInfo;
type CheckoutFormErrors = Partial<Record<keyof CheckoutFormState, string>>;

const initialFormState: CheckoutFormState = {
  name: "",
  phone: "",
  city: "",
  address: "",
  notes: "",
};

const egyptPhonePattern = /^(?:\+20|0020|20|0)?1[0125]\d{8}$/;

export default function CheckoutPageClient({
  locale,
  buyNowBookId,
  buyNowBook,
  buyNowQty,
}: CheckoutPageClientProps) {
  const t = useTranslations("Checkout");
  const router = useRouter();
  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clear);
  const hydrated = useCartStore((state) => state.hydrated);

  const isBuyNowRequested = Boolean(buyNowBookId);
  const isBuyNowMode = isBuyNowRequested && Boolean(buyNowBook);
  const [buyNowQuantity, setBuyNowQuantity] = useState(Math.max(1, buyNowQty));
  const [form, setForm] = useState<CheckoutFormState>(initialFormState);
  const [errors, setErrors] = useState<CheckoutFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const checkoutItems = useMemo(() => {
    if (isBuyNowMode && buyNowBook) {
      return [
        {
          id: buyNowBook.id,
          title: buyNowBook.title,
          price: buyNowBook.price,
          image: buyNowBook.image,
          qty: buyNowQuantity,
        },
      ];
    }

    return cartItems;
  }, [buyNowBook, buyNowQuantity, cartItems, isBuyNowMode]);

  const total = useMemo(
    () =>
      checkoutItems.reduce((sum, item) => sum + item.price * item.qty, 0),
    [checkoutItems],
  );

  const itemsCount = useMemo(
    () => checkoutItems.reduce((sum, item) => sum + item.qty, 0),
    [checkoutItems],
  );

  const validate = (): boolean => {
    const nextErrors: CheckoutFormErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = t("errors.name");
    }

    const phoneCandidate = form.phone.replace(/[\s-]/g, "");
    if (!phoneCandidate) {
      nextErrors.phone = t("errors.phoneRequired");
    } else if (!egyptPhonePattern.test(phoneCandidate)) {
      nextErrors.phone = t("errors.phoneInvalid");
    }

    if (!form.city.trim()) {
      nextErrors.city = t("errors.city");
    }

    if (!form.address.trim()) {
      nextErrors.address = t("errors.address");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateField = (field: keyof CheckoutFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!validate()) {
      return;
    }

    if (checkoutItems.length === 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const payload = {
        customer: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          city: form.city.trim(),
          address: form.address.trim(),
          notes: form.notes?.trim(),
        },
        items: checkoutItems.map((item) => ({
          bookId: item.id,
          qty: item.qty,
        })),
      };

      const createdOrder = await createOrderRequest(payload);

      if (!isBuyNowMode) {
        clearCart();
      }

      const whatsappLink = buildPlacedOrderLink(
        createdOrder.orderId,
        checkoutItems.map((item) => ({
          title: item.title,
          qty: item.qty,
          unitPrice: item.price,
        })),
        total,
        {
          name: form.name.trim(),
          phone: form.phone.trim(),
          city: form.city.trim(),
          address: form.address.trim(),
          notes: form.notes?.trim(),
        },
        locale,
      );

      window.open(whatsappLink, "_blank", "noopener,noreferrer");
      router.push(
        `/${locale}/order/success?orderId=${encodeURIComponent(createdOrder.orderId)}`,
      );
    } catch (error) {
      if (error instanceof OrderApiError) {
        if (error.status === 409 && error.code === "OUT_OF_STOCK") {
          setSubmitError(t("errors.outOfStock"));
        } else if (error.status === 429) {
          setSubmitError(t("errors.rateLimited"));
        } else {
          setSubmitError(t("errors.generic"));
        }

        return;
      }

      setSubmitError(t("errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isBuyNowRequested && !buyNowBook) {
    return (
      <main className="page-enter mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-16 text-center sm:px-6">
        <div className="glass-panel w-full rounded-3xl p-8 sm:p-12">
          <h1 className="text-3xl font-extrabold text-ink">{t("buyNowMissingTitle")}</h1>
          <p className="mt-3 text-ink-soft">{t("buyNowMissingDescription")}</p>
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

  if (!isBuyNowMode && !hydrated) {
    return (
      <main className="page-enter mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
        <div className="glass-panel rounded-3xl p-8 text-center">
          <p className="text-sm text-ink-soft">{t("loading")}</p>
        </div>
      </main>
    );
  }

  if (checkoutItems.length === 0) {
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
        <p className="mt-2 text-ink-soft">
          {isBuyNowMode ? t("buyNowSubtitle") : t("subtitle")}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="glass-panel rounded-3xl p-5 sm:p-7">
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">
                {t("fields.name")}
              </span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className="focus-visible-ring w-full rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft/70"
                placeholder={t("placeholders.name")}
                autoComplete="name"
              />
              {errors.name ? (
                <span className="mt-1.5 block text-xs text-rose-300">{errors.name}</span>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">
                {t("fields.phone")}
              </span>
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className="focus-visible-ring w-full rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft/70"
                placeholder={t("placeholders.phone")}
                autoComplete="tel"
                dir="ltr"
              />
              {errors.phone ? (
                <span className="mt-1.5 block text-xs text-rose-300">{errors.phone}</span>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">
                {t("fields.city")}
              </span>
              <input
                type="text"
                value={form.city}
                onChange={(event) => updateField("city", event.target.value)}
                className="focus-visible-ring w-full rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft/70"
                placeholder={t("placeholders.city")}
                autoComplete="address-level2"
              />
              {errors.city ? (
                <span className="mt-1.5 block text-xs text-rose-300">{errors.city}</span>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">
                {t("fields.address")}
              </span>
              <textarea
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
                className="focus-visible-ring min-h-28 w-full rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft/70"
                placeholder={t("placeholders.address")}
                autoComplete="street-address"
              />
              {errors.address ? (
                <span className="mt-1.5 block text-xs text-rose-300">{errors.address}</span>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">
                {t("fields.notes")}
              </span>
              <textarea
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                className="focus-visible-ring min-h-24 w-full rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft/70"
                placeholder={t("placeholders.notes")}
              />
            </label>

            {submitError ? (
              <p className="rounded-xl border border-rose-300/30 bg-rose-500/12 px-4 py-2.5 text-sm text-rose-200">
                {submitError}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="focus-visible-ring inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? t("submitting") : t("submit")}
              </button>
              <Link
                href={isBuyNowMode ? `/${locale}/books` : `/${locale}/cart`}
                className="focus-visible-ring inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-bold text-ink transition-colors hover:bg-white/15"
              >
                {isBuyNowMode ? t("backToBooks") : t("backToCart")}
              </Link>
            </div>
          </form>
        </section>

        <aside className="glass-panel h-fit rounded-3xl p-5">
          <h2 className="text-lg font-bold text-ink">{t("summaryTitle")}</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {t("itemsCount", { count: itemsCount })}
          </p>

          <div className="mt-4 space-y-3">
            {checkoutItems.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-white/10 bg-white/6 p-3 text-sm"
              >
                <h3 className="font-semibold text-ink">{item.title}</h3>
                <p className="mt-1 text-ink-soft">
                  {item.qty} x {formatPriceEGP(item.price, locale)}
                </p>
                <p className="mt-1 text-cyan-300">
                  {formatPriceEGP(item.price * item.qty, locale)}
                </p>

                {isBuyNowMode ? (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-2 py-1">
                    <button
                      type="button"
                      onClick={() =>
                        setBuyNowQuantity((current) => Math.max(1, current - 1))
                      }
                      className="focus-visible-ring inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-ink transition-colors hover:bg-white/18"
                    >
                      -
                    </button>
                    <span className="min-w-6 text-center text-sm font-semibold text-ink">
                      {buyNowQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setBuyNowQuantity((current) => current + 1)}
                      className="focus-visible-ring inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-ink transition-colors hover:bg-white/18"
                    >
                      +
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="text-base font-semibold text-ink">
              {t("total")}: <span className="text-cyan-300">{formatPriceEGP(total, locale)}</span>
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

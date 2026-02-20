"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { getOrderRequest, OrderApiError, orderTimeline } from "@/lib/orders";
import type { Locale, PublicOrderDetails } from "@/lib/types";
import { cn, formatPriceEGP } from "@/lib/utils";

interface OrderSuccessClientProps {
  locale: Locale;
  orderId?: string;
}

type LoadingState = "loading" | "ready" | "not-found" | "error";

export default function OrderSuccessClient({
  locale,
  orderId,
}: OrderSuccessClientProps) {
  const t = useTranslations("OrderSuccess");
  const [order, setOrder] = useState<PublicOrderDetails | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");

  const loadOrder = useCallback(async () => {
      if (!orderId) {
        setOrder(null);
        setLoadingState("not-found");
        return;
      }

      try {
        const response = await getOrderRequest(orderId);
        setOrder(response.data);
        setLoadingState("ready");
      } catch (error) {
        if (error instanceof OrderApiError && error.status === 404) {
          setOrder(null);
          setLoadingState("not-found");
          return;
        }

        setOrder(null);
        setLoadingState("error");
      }
    }, [orderId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadOrder();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadOrder]);

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadOrder();
    }, 8000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadOrder, orderId]);

  const itemCount = useMemo(
    () => order?.items.reduce((sum, item) => sum + item.qty, 0) ?? 0,
    [order],
  );

  const currentTimelineIndex = useMemo(() => {
    if (!order || order.status === "CANCELLED") {
      return -1;
    }

    return orderTimeline.findIndex((status) => status === order.status);
  }, [order]);

  const formattedDate = useMemo(() => {
    if (!order) {
      return "";
    }

    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(order.createdAt));
  }, [locale, order]);

  if (loadingState === "loading") {
    return (
      <main className="page-enter mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-16 text-center sm:px-6">
        <div className="glass-panel w-full rounded-3xl p-8">
          <p className="text-sm text-ink-soft">{t("loading")}</p>
        </div>
      </main>
    );
  }

  if (loadingState === "not-found" || loadingState === "error" || !order) {
    return (
      <main className="page-enter mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-16 text-center sm:px-6">
        <div className="glass-panel w-full rounded-3xl p-8 sm:p-12">
          <h1 className="text-3xl font-extrabold text-ink">
            {loadingState === "error" ? t("errorTitle") : t("notFoundTitle")}
          </h1>
          <p className="mt-3 text-ink-soft">
            {loadingState === "error" ? t("errorDescription") : t("notFoundDescription")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              href={`/${locale}/track${orderId ? `?orderId=${encodeURIComponent(orderId)}` : ""}`}
              className="focus-visible-ring inline-flex rounded-xl bg-linear-to-l from-brand to-brand-strong px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.02]"
            >
              {t("trackOrder")}
            </Link>
            <Link
              href={`/${locale}/books`}
              className="focus-visible-ring inline-flex rounded-xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-white/15"
            >
              {t("browseProducts")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-enter mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-16 text-center sm:px-6">
      <div className="glass-panel w-full rounded-3xl p-8 sm:p-12">
        <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full border border-emerald-300/35 bg-emerald-500/20 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.35)]">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
            <path
              d="m5 12.5 4.2 4.2L19 7.4"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <h1 className="mt-5 text-3xl font-extrabold text-ink">{t("title")}</h1>
        <p className="mt-2 text-ink-soft">{t("subtitle")}</p>

        <div className="mt-6 grid gap-3 text-start sm:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/7 p-4">
            <p className="text-xs text-ink-soft">{t("labels.orderId")}</p>
            <p className="mt-1 text-sm font-bold text-ink">{order.orderId}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/7 p-4">
            <p className="text-xs text-ink-soft">{t("labels.date")}</p>
            <p className="mt-1 text-sm font-bold text-ink">{formattedDate}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/7 p-4">
            <p className="text-xs text-ink-soft">{t("labels.total")}</p>
            <p className="mt-1 text-sm font-bold text-cyan-300">
              {formatPriceEGP(order.total, locale)}
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/7 p-4">
            <p className="text-xs text-ink-soft">{t("labels.itemCount")}</p>
            <p className="mt-1 text-sm font-bold text-ink">{itemCount}</p>
          </article>
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-white/7 p-4 text-start">
          <p className="text-sm font-semibold text-ink">{t("labels.statusTimeline")}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-4">
            {orderTimeline.map((status, index) => {
              const isDone = order.status !== "CANCELLED" && index <= currentTimelineIndex;
              const isCurrent = order.status !== "CANCELLED" && index === currentTimelineIndex;
              const milestoneKey =
                status === "PENDING"
                  ? "createdAt"
                  : status === "CONFIRMED"
                    ? "confirmedAt"
                    : status === "SHIPPED"
                      ? "shippedAt"
                      : "deliveredAt";
              const milestoneDate = order.timeline[milestoneKey];
              const formattedMilestoneDate = milestoneDate
                ? new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(new Date(milestoneDate))
                : null;

              return (
                <article
                  key={status}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm transition-colors",
                    isDone
                      ? "border-emerald-300/40 bg-emerald-500/18 text-emerald-200"
                      : "border-white/10 bg-white/7 text-ink-soft",
                    isCurrent && "shadow-[0_0_16px_rgba(16,185,129,0.25)]",
                  )}
                >
                  <p>{t(`status.${status}`)}</p>
                  <p className="mt-1 text-[11px] text-inherit/80">
                    {formattedMilestoneDate ?? t("labels.pendingDate")}
                  </p>
                </article>
              );
            })}
          </div>

          {order.status === "CANCELLED" ? (
            <p className="mt-3 rounded-lg border border-rose-300/30 bg-rose-500/12 px-3 py-2 text-sm text-rose-200">
              {order.timeline.cancelledAt
                ? `${t("status.CANCELLED")} - ${new Intl.DateTimeFormat(
                    locale === "ar" ? "ar-EG" : "en-US",
                    {
                      dateStyle: "short",
                      timeStyle: "short",
                    },
                  ).format(new Date(order.timeline.cancelledAt))}`
                : t("status.CANCELLED")}
            </p>
          ) : null}
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-white/7 p-4 text-start">
          <p className="text-xs text-ink-soft">{t("labels.items")}</p>
          <ul className="mt-2 space-y-1">
            {order.items.map((item) => (
              <li key={`${order.orderId}-${item.bookId}`} className="text-sm text-ink">
                {item.titleSnapshot} x{item.qty}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Link
            href={`/${locale}`}
            className="focus-visible-ring inline-flex rounded-xl bg-linear-to-l from-brand to-brand-strong px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.02]"
          >
            {t("goHome")}
          </Link>
          <Link
            href={`/${locale}/books`}
            className="focus-visible-ring inline-flex rounded-xl border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-white/15"
          >
            {t("browseProducts")}
          </Link>
          <Link
            href={`/${locale}/track?orderId=${encodeURIComponent(order.orderId)}`}
            className="focus-visible-ring inline-flex rounded-xl border border-cyan-300/25 bg-cyan-500/12 px-5 py-3 text-sm font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/20"
          >
            {t("trackOrder")}
          </Link>
        </div>
      </div>
    </main>
  );
}

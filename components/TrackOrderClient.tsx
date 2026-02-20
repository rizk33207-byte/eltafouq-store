"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  getOrderRequest,
  OrderApiError,
  orderTimeline,
} from "@/lib/orders";
import {
  type Locale,
  type PublicOrderDetails,
} from "@/lib/types";
import { cn, formatPriceEGP } from "@/lib/utils";

interface TrackOrderClientProps {
  locale: Locale;
  initialOrderId?: string;
}

export default function TrackOrderClient({
  locale,
  initialOrderId,
}: TrackOrderClientProps) {
  const t = useTranslations("TrackPage");
  const tStatus = useTranslations("OrderStatus");

  const [query, setQuery] = useState(initialOrderId ?? "");
  const [order, setOrder] = useState<PublicOrderDetails | null>(null);
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(
    initialOrderId?.trim().toUpperCase() || null,
  );
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [timelineSteps, setTimelineSteps] = useState(orderTimeline);

  const searchOrder = useCallback(
    async (rawValue: string) => {
      const normalized = rawValue.trim().toUpperCase();
      setSearched(true);
      setRequestError(null);

      if (!normalized) {
        setOrder(null);
        setTrackedOrderId(null);
        return;
      }

      setTrackedOrderId(normalized);

      try {
        setIsLoading(true);
        const response = await getOrderRequest(normalized);
        setOrder(response.data);
        setTimelineSteps(response.meta?.timeline ?? orderTimeline);
      } catch (error) {
        setOrder(null);

        if (error instanceof OrderApiError && error.status === 404) {
          setTrackedOrderId(null);
          return;
        }

        setRequestError(t("requestFailed"));
      } finally {
        setIsLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    if (!initialOrderId) {
      return;
    }

    void searchOrder(initialOrderId);
  }, [initialOrderId, searchOrder]);

  useEffect(() => {
    if (!trackedOrderId) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void (async () => {
        try {
          const response = await getOrderRequest(trackedOrderId);
          setOrder(response.data);
          setTimelineSteps(response.meta?.timeline ?? orderTimeline);
          setRequestError(null);
        } catch (error) {
          if (error instanceof OrderApiError && error.status === 404) {
            setOrder(null);
            return;
          }

          setRequestError(t("requestFailed"));
        }
      })();
    }, 8000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [trackedOrderId, t]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void searchOrder(query);
  };

  const currentTimelineIndex = useMemo(() => {
    if (!order || order.status === "CANCELLED") {
      return -1;
    }

    return timelineSteps.findIndex((status) => status === order.status);
  }, [order, timelineSteps]);

  const formattedDate = useMemo(() => {
    if (!order) {
      return "";
    }

    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(order.createdAt));
  }, [locale, order]);

  return (
    <main className="page-enter mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <section className="glass-panel rounded-3xl p-6 sm:p-8">
        <h1 className="text-3xl font-extrabold text-ink">{t("title")}</h1>
        <p className="mt-2 text-ink-soft">{t("subtitle")}</p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("placeholder")}
            className="focus-visible-ring min-h-11 flex-1 rounded-xl border border-white/15 bg-white/8 px-4 text-sm text-ink placeholder:text-ink-soft/70"
          />
          <button
            type="submit"
            className="focus-visible-ring rounded-xl bg-linear-to-l from-brand to-brand-strong px-5 py-2.5 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.02]"
          >
            {isLoading ? t("searchLoading") : t("search")}
          </button>
        </form>

        {searched && !order && !requestError ? (
          <p className="mt-4 rounded-xl border border-rose-300/30 bg-rose-500/12 px-4 py-2.5 text-sm text-rose-200">
            {t("notFound")}
          </p>
        ) : null}

        {requestError ? (
          <p className="mt-4 rounded-xl border border-rose-300/30 bg-rose-500/12 px-4 py-2.5 text-sm text-rose-200">
            {requestError}
          </p>
        ) : null}

        {order ? (
          <div className="mt-6 space-y-4">
            <div className="grid gap-3 text-start sm:grid-cols-2">
              <article className="rounded-2xl border border-white/10 bg-white/7 p-4">
                <p className="text-xs text-ink-soft">{t("labels.orderId")}</p>
                <p className="mt-1 text-sm font-bold text-ink">{order.orderId}</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/7 p-4">
                <p className="text-xs text-ink-soft">{t("labels.status")}</p>
                <p className="mt-1 text-sm font-bold text-cyan-300">
                  {tStatus(order.status)}
                </p>
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
            </div>

            <div className="grid gap-3 text-start sm:grid-cols-2">
              <article className="rounded-2xl border border-white/10 bg-white/7 p-4">
                <p className="text-xs text-ink-soft">{t("labels.customerName")}</p>
                <p className="mt-1 text-sm font-bold text-ink">{order.customer.name}</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-white/7 p-4">
                <p className="text-xs text-ink-soft">{t("labels.phone")}</p>
                <p className="mt-1 text-sm font-bold text-ink">{order.customer.phoneMasked}</p>
              </article>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/7 p-4">
              <p className="text-sm font-semibold text-ink">{t("timelineTitle")}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                {timelineSteps.map((status, index) => {
                  const isDone =
                    order.status !== "CANCELLED" && index <= currentTimelineIndex;
                  const isCurrent =
                    order.status !== "CANCELLED" &&
                    index === currentTimelineIndex;
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
                      <p>{tStatus(status)}</p>
                      <p className="mt-1 text-[11px] text-inherit/80">
                        {formattedMilestoneDate ?? t("timelineNoDate")}
                      </p>
                    </article>
                  );
                })}
              </div>

              {order.status === "CANCELLED" ? (
                <p className="mt-3 rounded-lg border border-rose-300/30 bg-rose-500/12 px-3 py-2 text-sm text-rose-200">
                  {order.timeline.cancelledAt
                    ? `${t("cancelled")} - ${new Intl.DateTimeFormat(
                        locale === "ar" ? "ar-EG" : "en-US",
                        {
                          dateStyle: "short",
                          timeStyle: "short",
                        },
                      ).format(new Date(order.timeline.cancelledAt))}`
                    : t("cancelled")}
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/7 p-4">
              <p className="text-sm font-semibold text-ink">{t("labels.items")}</p>
              <ul className="mt-2 space-y-1">
                {order.items.map((item) => (
                  <li key={`${order.orderId}-${item.bookId}`} className="text-sm text-ink">
                    {item.titleSnapshot} x{item.qty}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

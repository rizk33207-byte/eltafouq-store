"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { formatDateTime } from "@/lib/date-format";
import {
  type AdminRole,
  orderStatusValues,
  type Locale,
  type OrderStatus,
  type PublicOrderDetails,
} from "@/lib/types";
import { cn, formatPriceEGP } from "@/lib/utils";
import AdminShell from "./AdminShell";

interface AdminOrderDetailsResponse {
  data: PublicOrderDetails;
  meta?: {
    timeline?: Array<Exclude<OrderStatus, "CANCELLED">>;
  };
}

interface AdminOrderDetailsClientProps {
  locale: Locale;
  orderId: string;
}

const statusOptions: ReadonlyArray<OrderStatus> = [...orderStatusValues];

const isOrderStatusValue = (value: string): value is OrderStatus =>
  statusOptions.includes(value as OrderStatus);

export default function AdminOrderDetailsClient({
  locale,
  orderId,
}: AdminOrderDetailsClientProps) {
  const t = useTranslations();
  const tStatus = useTranslations("OrderStatus");
  const [order, setOrder] = useState<PublicOrderDetails | null>(null);
  const [timeline, setTimeline] = useState<Array<Exclude<OrderStatus, "CANCELLED">>>([
    "PENDING",
    "CONFIRMED",
    "SHIPPED",
    "DELIVERED",
  ]);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("PENDING");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [role, setRole] = useState<AdminRole | null>(null);

  const canEditOrderStatus = role === "SUPER_ADMIN" || role === "ADMIN";

  useEffect(() => {
    const loadRole = async () => {
      try {
        const response = await fetch("/api/admin/auth/me", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          data: { role: AdminRole };
        };
        setRole(payload.data.role);
      } catch {
        setRole(null);
      }
    };

    void loadRole();
  }, []);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          setError(t("admin.orders.details.loadError"));
          return;
        }

        const payload = (await response.json()) as AdminOrderDetailsResponse;
        setOrder(payload.data);
        setTimeline(payload.meta?.timeline ?? [
          "PENDING",
          "CONFIRMED",
          "SHIPPED",
          "DELIVERED",
        ]);
        setSelectedStatus(payload.data.status);
      } catch {
        setError(t("admin.orders.details.loadError"));
      } finally {
        setLoading(false);
      }
    };

    void loadOrder();
  }, [orderId, t]);

  const currentTimelineIndex = useMemo(() => {
    if (!order || order.status === "CANCELLED") {
      return -1;
    }

    return timeline.findIndex((item) => item === order.status);
  }, [order, timeline]);

  const handleSaveStatus = async () => {
    if (!order || saving || selectedStatus === order.status || !canEditOrderStatus) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setToast(null);

      const response = await fetch(`/api/admin/orders/${encodeURIComponent(order.orderId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          status: selectedStatus,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string; code?: string; message?: string }
          | null;
        const errorCode = payload?.error ?? payload?.code;

        if (response.status === 401) {
          setError(t("admin.orders.details.unauthorizedError"));
        } else if (response.status === 403) {
          setError(t("admin.orders.details.forbiddenError"));
        } else if (response.status === 400) {
          setError(t("admin.orders.details.invalidPayloadError"));
        } else if (
          response.status === 409 &&
          errorCode === "INVALID_STATUS_TRANSITION"
        ) {
          setError(t("admin.orders.details.transitionError"));
        } else {
          setError(t("admin.orders.details.saveError"));
        }
        return;
      }

      const payload = (await response.json()) as AdminOrderDetailsResponse;
      setOrder(payload.data);
      setTimeline(payload.meta?.timeline ?? [
        "PENDING",
        "CONFIRMED",
        "SHIPPED",
        "DELIVERED",
      ]);
      setToast(t("admin.orders.details.saved"));
    } catch {
      setError(t("admin.orders.details.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const createdAtLabel = useMemo(
    () => (order ? formatDateTime(order.createdAt, locale) : null),
    [order, locale],
  );

  const cancelledAtLabel = useMemo(
    () =>
      order?.timeline.cancelledAt
        ? formatDateTime(order.timeline.cancelledAt, locale)
        : null,
    [order, locale],
  );

  const timelineLabels = useMemo(() => {
    if (!order) {
      return {} as Record<Exclude<OrderStatus, "CANCELLED">, string | null>;
    }

    return {
      PENDING: order.timeline.createdAt
        ? formatDateTime(order.timeline.createdAt, locale)
        : null,
      CONFIRMED: order.timeline.confirmedAt
        ? formatDateTime(order.timeline.confirmedAt, locale)
        : null,
      SHIPPED: order.timeline.shippedAt
        ? formatDateTime(order.timeline.shippedAt, locale)
        : null,
      DELIVERED: order.timeline.deliveredAt
        ? formatDateTime(order.timeline.deliveredAt, locale)
        : null,
    };
  }, [order, locale]);

  return (
    <AdminShell
      locale={locale}
      title={t("admin.orders.details.title", { orderId })}
      description={t("admin.orders.details.description")}
    >
      <div className="mb-4">
        <Link
          href={`/${locale}/admin/orders`}
          className="focus-visible-ring inline-flex rounded-xl border border-white/15 bg-white/8 px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-white/14 hover:text-ink"
        >
          {t("admin.orders.details.backToOrders")}
        </Link>
      </div>

      {loading ? (
        <div className="glass-panel rounded-2xl p-6 text-sm text-ink-soft">{t("admin.actions.loading")}</div>
      ) : error ? (
        <div className="glass-panel rounded-2xl border border-rose-300/35 bg-rose-500/12 p-6 text-sm text-rose-200">
          {error}
        </div>
      ) : !order ? (
        <div className="glass-panel rounded-2xl p-6 text-sm text-ink-soft">{t("admin.orders.empty")}</div>
      ) : (
        <div className="space-y-4">
          {toast ? (
            <div className="rounded-xl border border-emerald-300/35 bg-emerald-500/15 px-4 py-2 text-sm text-emerald-200">
              {toast}
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="glass-panel rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-ink">{t("admin.orders.details.summary")}</h2>
              <div className="mt-3 space-y-2 text-sm text-ink-soft">
                <p>
                  {t("admin.orders.table.orderId")}: <span className="text-ink">{order.orderId}</span>
                </p>
                <p>
                  {t("admin.orders.table.total")}:{" "}
                  <span className="text-cyan-300">{formatPriceEGP(order.total, locale)}</span>
                </p>
                <p>
                  {t("admin.orders.table.date")}: <span className="text-ink">{createdAtLabel}</span>
                </p>
              </div>
            </section>

            <section className="glass-panel rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-ink">{t("admin.orders.details.customerInfo")}</h2>
              <div className="mt-3 space-y-2 text-sm text-ink-soft">
                <p>
                  {t("admin.orders.table.customer")}: <span className="text-ink">{order.customer.name}</span>
                </p>
                <p>
                  {t("admin.orders.details.maskedPhone")}:{" "}
                  <span className="text-ink">{order.customer.phoneMasked}</span>
                </p>
                <p>
                  {t("admin.orders.table.city")}: <span className="text-ink">{order.customer.city}</span>
                </p>
                <p>
                  {t("admin.orders.details.address")}: <span className="text-ink">{order.customer.address}</span>
                </p>
                <p>
                  {t("admin.orders.details.notes")}:{" "}
                  <span className="text-ink">{order.customer.notes || t("admin.orders.details.none")}</span>
                </p>
              </div>
            </section>
          </div>

          <section className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-ink">{t("admin.orders.details.timeline")}</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              {timeline.map((status, index) => {
                const isDone = order.status !== "CANCELLED" && index <= currentTimelineIndex;
                const isCurrent =
                  order.status !== "CANCELLED" && index === currentTimelineIndex;
                const formattedMilestoneDate =
                  timelineLabels[status as Exclude<OrderStatus, "CANCELLED">];

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
                      {formattedMilestoneDate ?? t("admin.orders.details.timelineNoDate")}
                    </p>
                  </article>
                );
              })}
            </div>

            {order.status === "CANCELLED" ? (
              <p className="mt-3 rounded-lg border border-rose-300/30 bg-rose-500/12 px-3 py-2 text-sm text-rose-200">
                {tStatus("CANCELLED")}
                {cancelledAtLabel ? ` - ${cancelledAtLabel}` : ""}
              </p>
            ) : null}
          </section>

          <section className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-ink">{t("admin.orders.details.items")}</h2>
            <div className="mt-3 space-y-2">
              {order.items.map((item) => (
                <article
                  key={`${order.orderId}-${item.bookId}`}
                  className="rounded-xl border border-white/10 bg-white/7 p-3 text-sm text-ink-soft"
                >
                  <p className="font-semibold text-ink">{item.titleSnapshot}</p>
                  <p>
                    {item.qty} x {formatPriceEGP(item.unitPrice, locale)}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {canEditOrderStatus ? (
            <section className="glass-panel rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-ink">{t("admin.orders.details.updateStatus")}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={selectedStatus}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (isOrderStatusValue(value)) {
                      setSelectedStatus(value);
                    }
                  }}
                  className="focus-visible-ring min-h-11 rounded-xl border border-white/15 bg-white/8 px-3 text-sm text-ink"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {tStatus(status)}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleSaveStatus}
                  disabled={saving || selectedStatus === order.status}
                  className="focus-visible-ring rounded-xl bg-linear-to-l from-brand to-brand-strong px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? t("admin.actions.saving") : t("admin.actions.save")}
                </button>
              </div>
            </section>
          ) : null}
        </div>
      )}
    </AdminShell>
  );
}

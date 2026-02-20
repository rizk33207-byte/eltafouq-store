"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { formatDateTime } from "@/lib/date-format";
import type { Locale, OrderStatus } from "@/lib/types";
import { formatPriceEGP } from "@/lib/utils";
import AdminShell from "./AdminShell";

interface AdminOrderRow {
  orderId: string;
  status: OrderStatus;
  createdAt: string;
  createdAtLabel?: string;
  total: number;
  customerName: string;
  city: string;
}

interface AdminOrdersResponse {
  data: AdminOrderRow[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface AdminPatchOrderResponse {
  data?: {
    orderId: string;
    status: OrderStatus;
  };
  error?: string;
  code?: string;
}

interface AdminOrdersClientProps {
  locale: Locale;
}

const statusOptions: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const isOrderStatus = (value: string): value is OrderStatus =>
  statusOptions.includes(value as OrderStatus);

export default function AdminOrdersClient({ locale }: AdminOrdersClientProps) {
  const t = useTranslations();
  const tStatus = useTranslations("OrderStatus");
  const [status, setStatus] = useState<"" | OrderStatus>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [meta, setMeta] = useState<AdminOrdersResponse["meta"]>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [savingByOrderId, setSavingByOrderId] = useState<Record<string, boolean>>({});

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));

    if (status) {
      params.set("status", status);
    }

    if (search.trim()) {
      params.set("q", search.trim());
    }

    return params.toString();
  }, [page, search, status]);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/admin/orders?${queryString}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          setError(t("admin.orders.loadError"));
          return;
        }

        const payload = (await response.json()) as AdminOrdersResponse;
        setOrders(
          payload.data.map((order) => ({
            ...order,
            createdAtLabel: formatDateTime(order.createdAt, locale),
          })),
        );
        setMeta(payload.meta);
      } catch {
        setError(t("admin.orders.loadError"));
      } finally {
        setLoading(false);
      }
    };

    void loadOrders();
  }, [queryString, t, locale]);

  const setOrderStatusLocal = (orderId: string, nextStatus: OrderStatus) => {
    setOrders((current) =>
      current.map((order) =>
        order.orderId === orderId ? { ...order, status: nextStatus } : order,
      ),
    );
  };

  const setRowSavingState = (orderId: string, isSaving: boolean) => {
    setSavingByOrderId((current) => ({
      ...current,
      [orderId]: isSaving,
    }));
  };

  const handleRowStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    const currentOrder = orders.find((order) => order.orderId === orderId);

    if (!currentOrder || currentOrder.status === nextStatus || savingByOrderId[orderId]) {
      return;
    }

    const previousStatus = currentOrder.status;

    setError(null);
    setToast(null);
    setOrderStatusLocal(orderId, nextStatus);
    setRowSavingState(orderId, true);

    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          status: nextStatus,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | AdminPatchOrderResponse
        | null;

      if (!response.ok) {
        setOrderStatusLocal(orderId, previousStatus);

        const code = payload?.error ?? payload?.code;

        if (response.status === 401) {
          setError(t("admin.orders.details.unauthorizedError"));
        } else if (response.status === 403) {
          setError(t("admin.orders.details.forbiddenError"));
        } else if (response.status === 400) {
          setError(t("admin.orders.details.invalidPayloadError"));
        } else if (response.status === 409 && code === "INVALID_STATUS_TRANSITION") {
          setError(t("admin.orders.details.transitionError"));
        } else {
          setError(t("admin.orders.details.saveError"));
        }

        return;
      }

      const confirmedStatus = payload?.data?.status ?? nextStatus;
      setOrderStatusLocal(orderId, confirmedStatus);
      setToast(t("admin.orders.details.saved"));
    } catch {
      setOrderStatusLocal(orderId, previousStatus);
      setError(t("admin.orders.details.saveError"));
    } finally {
      setRowSavingState(orderId, false);
    }
  };

  return (
    <AdminShell
      locale={locale}
      title={t("admin.orders.title")}
      description={t("admin.orders.description")}
    >
      <div className="glass-panel rounded-2xl p-4">
        <div className="grid gap-3 md:grid-cols-[0.25fr_1fr_auto]">
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as "" | OrderStatus);
              setPage(1);
            }}
            className="focus-visible-ring min-h-11 rounded-xl border border-white/15 bg-white/8 px-3 text-sm text-ink"
          >
            <option value="">{t("admin.orders.filters.allStatuses")}</option>
            {statusOptions.map((value) => (
              <option key={value} value={value}>
                {tStatus(value)}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={t("admin.orders.filters.search")}
            className="focus-visible-ring min-h-11 rounded-xl border border-white/15 bg-white/8 px-4 text-sm text-ink placeholder:text-ink-soft/70"
          />

          <button
            type="button"
            onClick={() => {
              setStatus("");
              setSearch("");
              setPage(1);
            }}
            className="focus-visible-ring rounded-xl border border-white/15 bg-white/8 px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-white/14 hover:text-ink"
          >
            {t("admin.actions.reset")}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-300/35 bg-rose-500/12 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {toast ? (
        <div className="mt-4 rounded-xl border border-emerald-300/35 bg-emerald-500/12 px-4 py-3 text-sm text-emerald-200">
          {toast}
        </div>
      ) : null}

      <div className="glass-panel mt-4 overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[920px] text-start">
          <thead className="border-b border-white/10 text-xs text-ink-soft">
            <tr>
              <th className="px-4 py-3">{t("admin.orders.table.orderId")}</th>
              <th className="px-4 py-3">{t("admin.orders.table.status")}</th>
              <th className="px-4 py-3">{t("admin.orders.table.updateStatus")}</th>
              <th className="px-4 py-3">{t("admin.orders.table.customer")}</th>
              <th className="px-4 py-3">{t("admin.orders.table.city")}</th>
              <th className="px-4 py-3">{t("admin.orders.table.total")}</th>
              <th className="px-4 py-3">{t("admin.orders.table.date")}</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-sm text-ink-soft" colSpan={7}>
                  {t("admin.actions.loading")}
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-ink-soft" colSpan={7}>
                  {t("admin.orders.empty")}
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.orderId} className="border-b border-white/8 text-sm text-ink">
                  <td className="px-4 py-3 font-semibold text-cyan-300">
                    <Link
                      href={`/${locale}/admin/orders/${encodeURIComponent(order.orderId)}`}
                      className="focus-visible-ring rounded px-1 py-0.5 transition-colors hover:text-cyan-200"
                    >
                      {order.orderId}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{tStatus(order.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-[180px] flex-col gap-1">
                      <select
                        value={order.status}
                        onChange={(event) => {
                          const nextValue = event.target.value;

                          if (isOrderStatus(nextValue)) {
                            void handleRowStatusChange(order.orderId, nextValue);
                          }
                        }}
                        disabled={Boolean(savingByOrderId[order.orderId])}
                        className="focus-visible-ring min-h-10 rounded-xl border border-white/15 bg-white/8 px-3 text-xs text-ink disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {statusOptions.map((value) => (
                          <option key={value} value={value}>
                            {tStatus(value)}
                          </option>
                        ))}
                      </select>
                      {savingByOrderId[order.orderId] ? (
                        <span className="text-[11px] text-ink-soft">{t("admin.actions.saving")}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">{order.customerName}</td>
                  <td className="px-4 py-3">{order.city}</td>
                  <td className="px-4 py-3">{formatPriceEGP(order.total, locale)}</td>
                  <td className="px-4 py-3">
                    {order.createdAtLabel}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-ink-soft">
          {t("admin.orders.pagination.pageInfo", {
            page: meta?.page ?? page,
            totalPages: meta?.totalPages ?? 1,
          })}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={(meta?.page ?? page) <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="focus-visible-ring rounded-xl border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("admin.orders.pagination.prev")}
          </button>
          <button
            type="button"
            disabled={(meta?.page ?? page) >= (meta?.totalPages ?? 1)}
            onClick={() =>
              setPage((current) =>
                Math.min(meta?.totalPages ?? current + 1, current + 1),
              )
            }
            className="focus-visible-ring rounded-xl border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("admin.orders.pagination.next")}
          </button>
        </div>
      </div>
    </AdminShell>
  );
}

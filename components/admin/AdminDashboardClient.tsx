"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Locale, OrderStatus } from "@/lib/types";
import { cn, formatPriceEGP } from "@/lib/utils";
import AdminShell from "./AdminShell";

interface AdminStatsResponse {
  totalOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
}

interface RevenueChartResponse {
  labels: string[];
  data: number[];
}

interface LowStockBook {
  id: string;
  title: string;
  stock: number;
  lowStock: boolean;
}

interface InventoryAlertsResponse {
  data: LowStockBook[];
}

interface AdminDashboardClientProps {
  locale: Locale;
}

const chartRanges = ["7d", "30d", "12m"] as const;
type ChartRange = (typeof chartRanges)[number];

const statusOrder: Array<{
  key: OrderStatus;
  valueKey: keyof Pick<
    AdminStatsResponse,
    "pendingOrders" | "confirmedOrders" | "shippedOrders" | "deliveredOrders" | "cancelledOrders"
  >;
}> = [
  { key: "PENDING", valueKey: "pendingOrders" },
  { key: "CONFIRMED", valueKey: "confirmedOrders" },
  { key: "SHIPPED", valueKey: "shippedOrders" },
  { key: "DELIVERED", valueKey: "deliveredOrders" },
  { key: "CANCELLED", valueKey: "cancelledOrders" },
];

const formatRevenueLabel = (value: string, locale: Locale, range: ChartRange): string => {
  const date = range === "12m" ? new Date(`${value}-01T00:00:00.000Z`) : new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    month: "short",
    day: range === "12m" ? undefined : "numeric",
  }).format(date);
};

export default function AdminDashboardClient({ locale }: AdminDashboardClientProps) {
  const t = useTranslations();
  const tStatus = useTranslations("OrderStatus");

  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [alerts, setAlerts] = useState<LowStockBook[]>([]);
  const [chartRange, setChartRange] = useState<ChartRange>("30d");
  const [chart, setChart] = useState<RevenueChartResponse>({ labels: [], data: [] });
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsResponse, alertsResponse] = await Promise.all([
          fetch("/api/admin/stats", { cache: "no-store" }),
          fetch("/api/admin/inventory/alerts", { cache: "no-store" }),
        ]);

        if (!statsResponse.ok || !alertsResponse.ok) {
          setError(t("admin.dashboard.loadError"));
          return;
        }

        const statsPayload = (await statsResponse.json()) as AdminStatsResponse;
        const alertsPayload = (await alertsResponse.json()) as InventoryAlertsResponse;
        setStats(statsPayload);
        setAlerts(alertsPayload.data ?? []);
      } catch {
        setError(t("admin.dashboard.loadError"));
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [t]);

  useEffect(() => {
    const loadChart = async () => {
      try {
        setChartLoading(true);
        const response = await fetch(`/api/admin/stats/revenue?range=${chartRange}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          setChart({ labels: [], data: [] });
          return;
        }

        const payload = (await response.json()) as RevenueChartResponse;
        setChart(payload);
      } catch {
        setChart({ labels: [], data: [] });
      } finally {
        setChartLoading(false);
      }
    };

    void loadChart();
  }, [chartRange]);

  const chartPoints = useMemo(() => {
    if (chart.data.length === 0) {
      return "";
    }

    const max = Math.max(...chart.data, 1);

    return chart.data
      .map((value, index) => {
        const x = chart.data.length === 1 ? 0 : (index / (chart.data.length - 1)) * 100;
        const y = 34 - (value / max) * 30;
        return `${x},${y}`;
      })
      .join(" ");
  }, [chart.data]);

  return (
    <AdminShell
      locale={locale}
      title={t("admin.dashboard.title")}
      description={t("admin.dashboard.description")}
    >
      {error ? (
        <div className="glass-panel rounded-2xl border border-rose-300/30 bg-rose-500/12 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article className="glass-panel rounded-2xl p-5">
          <p className="text-xs text-ink-soft">{t("admin.dashboard.metrics.totalOrders")}</p>
          <p className="mt-2 text-3xl font-extrabold text-cyan-300">
            {loading ? "..." : stats?.totalOrders ?? 0}
          </p>
        </article>
        <article className="glass-panel rounded-2xl p-5">
          <p className="text-xs text-ink-soft">{t("admin.dashboard.metrics.totalRevenue")}</p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-300">
            {loading ? "..." : formatPriceEGP(stats?.totalRevenue ?? 0, locale)}
          </p>
        </article>
        <article className="glass-panel rounded-2xl p-5">
          <p className="text-xs text-ink-soft">{t("admin.dashboard.metrics.todayRevenue")}</p>
          <p className="mt-2 text-3xl font-extrabold text-violet-300">
            {loading ? "..." : formatPriceEGP(stats?.todayRevenue ?? 0, locale)}
          </p>
        </article>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statusOrder.map((item) => (
          <article key={item.key} className="glass-panel rounded-2xl p-4">
            <p className="text-xs text-ink-soft">{tStatus(item.key)}</p>
            <p className="mt-1.5 text-2xl font-bold text-ink">
              {loading ? "..." : stats?.[item.valueKey] ?? 0}
            </p>
          </article>
        ))}
      </div>

      <section className="glass-panel mt-5 rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink">{t("admin.dashboard.revenueChartTitle")}</h2>
          <div className="flex gap-2">
            {chartRanges.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setChartRange(range)}
                className={cn(
                  "focus-visible-ring rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                  chartRange === range
                    ? "border-cyan-300/35 bg-cyan-500/18 text-cyan-200"
                    : "border-white/15 bg-white/8 text-ink-soft hover:bg-white/12 hover:text-ink",
                )}
              >
                {t(`admin.dashboard.ranges.${range}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/6 p-3">
          {chartLoading ? (
            <p className="text-sm text-ink-soft">{t("admin.actions.loading")}</p>
          ) : chart.data.length === 0 ? (
            <p className="text-sm text-ink-soft">{t("admin.dashboard.noRevenueData")}</p>
          ) : (
            <div>
              <svg viewBox="0 0 100 36" className="h-40 w-full">
                <defs>
                  <linearGradient id="revenue-line" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="rgba(56,189,248,1)" />
                    <stop offset="100%" stopColor="rgba(168,85,247,1)" />
                  </linearGradient>
                </defs>
                <polyline
                  points={chartPoints}
                  fill="none"
                  stroke="url(#revenue-line)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-ink-soft sm:grid-cols-6">
                {chart.labels.map((label, index) => (
                  <div key={`${label}-${index}`} className="truncate">
                    {formatRevenueLabel(label, locale, chartRange)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="glass-panel mt-5 rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink">{t("admin.dashboard.lowStockTitle")}</h2>
          <Link
            href={`/${locale}/admin/books`}
            className="focus-visible-ring rounded-lg border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:bg-white/12 hover:text-ink"
          >
            {t("admin.dashboard.goToBooks")}
          </Link>
        </div>

        {alerts.length === 0 ? (
          <p className="text-sm text-ink-soft">{t("admin.dashboard.lowStockEmpty")}</p>
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, 8).map((book) => (
              <article
                key={book.id}
                className="rounded-xl border border-rose-300/35 bg-rose-500/12 px-3 py-2 text-sm text-rose-100"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{book.title}</p>
                  <span className="rounded-full bg-rose-500/25 px-2 py-0.5 text-xs font-bold">
                    {t("admin.dashboard.stockLeft", { count: book.stock })}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AdminOrderDetailsClient from "@/components/admin/AdminOrderDetailsClient";
import type { Locale } from "@/lib/i18n";

interface AdminOrderDetailsPageProps {
  params: Promise<{ locale: string; orderId: string }>;
}

export async function generateMetadata({
  params,
}: AdminOrderDetailsPageProps): Promise<Metadata> {
  const { locale, orderId } = await params;
  const typedLocale = locale as Locale;
  const t = await getTranslations({ locale: typedLocale });

  return {
    title: t("admin.orders.details.title", { orderId }),
    description: t("admin.orders.details.description"),
  };
}

export default async function AdminOrderDetailsPage({
  params,
}: AdminOrderDetailsPageProps) {
  const { locale, orderId } = await params;
  const typedLocale = locale as Locale;
  setRequestLocale(typedLocale);

  return <AdminOrderDetailsClient locale={typedLocale} orderId={orderId} />;
}

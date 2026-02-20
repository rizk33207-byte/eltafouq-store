import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AdminOrdersClient from "@/components/admin/AdminOrdersClient";
import type { Locale } from "@/lib/i18n";

interface AdminOrdersPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: AdminOrdersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const t = await getTranslations({ locale: typedLocale });

  return {
    title: t("admin.orders.title"),
    description: t("admin.orders.description"),
  };
}

export default async function AdminOrdersPage({ params }: AdminOrdersPageProps) {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  setRequestLocale(typedLocale);

  return <AdminOrdersClient locale={typedLocale} />;
}

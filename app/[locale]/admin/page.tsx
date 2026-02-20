import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import type { Locale } from "@/lib/i18n";

interface AdminDashboardPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: AdminDashboardPageProps): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const t = await getTranslations({ locale: typedLocale });

  return {
    title: t("admin.dashboard.title"),
    description: t("admin.dashboard.description"),
  };
}

export default async function AdminDashboardPage({ params }: AdminDashboardPageProps) {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  setRequestLocale(typedLocale);

  return <AdminDashboardClient locale={typedLocale} />;
}

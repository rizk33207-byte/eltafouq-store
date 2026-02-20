import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AdminBooksClient from "@/components/admin/AdminBooksClient";
import type { Locale } from "@/lib/i18n";

interface AdminBooksPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: AdminBooksPageProps): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const t = await getTranslations({ locale: typedLocale });

  return {
    title: t("admin.books.title"),
    description: t("admin.books.description"),
  };
}

export default async function AdminBooksPage({ params }: AdminBooksPageProps) {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  setRequestLocale(typedLocale);

  return <AdminBooksClient locale={typedLocale} />;
}

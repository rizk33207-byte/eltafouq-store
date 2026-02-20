import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import type { Locale } from "@/lib/i18n";

interface AdminLoginPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const pickSingle = (value: string | string[] | undefined): string | undefined => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && value.length > 0) {
    return value[0];
  }

  return undefined;
};

export async function generateMetadata({
  params,
}: Omit<AdminLoginPageProps, "searchParams">): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const t = await getTranslations({ locale: typedLocale });

  return {
    title: t("admin.login.title"),
    description: t("admin.login.description"),
  };
}

export default async function AdminLoginPage({
  params,
  searchParams,
}: AdminLoginPageProps) {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  setRequestLocale(typedLocale);
  const nextPath = pickSingle((await searchParams).next);

  return <AdminLoginForm locale={typedLocale} nextPath={nextPath} />;
}

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CartPageClient from "@/components/CartPageClient";
import type { Locale } from "@/lib/i18n";

interface CartPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: CartPageProps): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const t = await getTranslations({ locale: typedLocale, namespace: "Cart" });

  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function CartPage({ params }: CartPageProps) {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  setRequestLocale(typedLocale);

  return <CartPageClient locale={typedLocale} />;
}

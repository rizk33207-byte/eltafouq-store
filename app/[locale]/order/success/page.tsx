import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import OrderSuccessClient from "@/components/OrderSuccessClient";
import type { Locale } from "@/lib/i18n";

interface OrderSuccessPageProps {
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
}: OrderSuccessPageProps): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const t = await getTranslations({
    locale: typedLocale,
    namespace: "OrderSuccess",
  });

  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function OrderSuccessPage({
  params,
  searchParams,
}: OrderSuccessPageProps) {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  setRequestLocale(typedLocale);

  const orderId = pickSingle((await searchParams).orderId);

  return <OrderSuccessClient locale={typedLocale} orderId={orderId} />;
}


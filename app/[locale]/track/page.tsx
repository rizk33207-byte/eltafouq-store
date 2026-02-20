import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import TrackOrderClient from "@/components/TrackOrderClient";
import type { Locale } from "@/lib/i18n";

interface TrackPageProps {
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
}: TrackPageProps): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const t = await getTranslations({ locale: typedLocale, namespace: "TrackPage" });

  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function TrackPage({ params, searchParams }: TrackPageProps) {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  setRequestLocale(typedLocale);

  const orderId = pickSingle((await searchParams).orderId);

  return <TrackOrderClient locale={typedLocale} initialOrderId={orderId} />;
}


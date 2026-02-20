import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CheckoutPageClient from "@/components/CheckoutPageClient";
import { getBookById } from "@/lib/api";
import type { Locale } from "@/lib/i18n";

interface CheckoutPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

interface CheckoutMetadataProps {
  params: Promise<{ locale: string }>;
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
}: CheckoutMetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const t = await getTranslations({ locale: typedLocale, namespace: "Checkout" });

  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function CheckoutPage({
  params,
  searchParams,
}: CheckoutPageProps) {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  setRequestLocale(typedLocale);

  const resolvedSearchParams = await searchParams;
  const buyNowBookId = pickSingle(resolvedSearchParams.buyNow);
  const buyNowQtyRaw = Number.parseInt(
    pickSingle(resolvedSearchParams.qty) ?? "1",
    10,
  );
  const buyNowQty = Number.isFinite(buyNowQtyRaw) && buyNowQtyRaw > 0 ? buyNowQtyRaw : 1;
  const buyNowBook = buyNowBookId ? await getBookById(buyNowBookId) : null;

  return (
    <CheckoutPageClient
      locale={typedLocale}
      buyNowBookId={buyNowBookId ?? null}
      buyNowBook={buyNowBook}
      buyNowQty={buyNowQty}
    />
  );
}

import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import NavbarSlot from "@/components/NavbarSlot";
import WhatsAppButton from "@/components/WhatsAppButton";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/i18n";
import { getBrandName } from "@/lib/utils";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: Omit<LocaleLayoutProps, "children">): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const t = await getTranslations({ locale: typedLocale, namespace: "Metadata" });
  const brandName = getBrandName(typedLocale);

  return {
    title: {
      default: brandName,
      template: `%s | ${brandName}`,
    },
    description: t("siteDescription"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const typedLocale = locale as Locale;
  setRequestLocale(typedLocale);
  const messages = await getMessages();
  const t = await getTranslations({ locale: typedLocale, namespace: "Layout" });

  return (
    <NextIntlClientProvider locale={typedLocale} messages={messages}>
      <div className="relative flex min-h-screen flex-col overflow-x-clip">
        <div className="pointer-events-none fixed inset-0 -z-30 bg-[#040714]" />
        <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(circle_at_18%_32%,rgba(35,126,255,0.27),transparent_45%),radial-gradient(circle_at_72%_56%,rgba(140,87,255,0.2),transparent_42%),radial-gradient(circle_at_45%_80%,rgba(23,210,255,0.13),transparent_35%)]" />
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_46%,rgba(1,3,10,0.78)_100%)]" />

        <NavbarSlot />

        <div className="flex-1">{children}</div>

        <footer className="border-t border-white/10 bg-surface/45 py-6 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 text-sm text-ink-soft sm:px-6 lg:px-8">
            <p className="font-semibold text-ink">{t("footerTitle")}</p>
            <p>{t("footerSubtitle")}</p>
          </div>
        </footer>

        <WhatsAppButton />
      </div>
    </NextIntlClientProvider>
  );
}

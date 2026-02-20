import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { hasLocale } from "next-intl";
import { headers } from "next/headers";
import { routing } from "@/i18n/routing";
import { defaultLocale, getDirection, type Locale } from "@/lib/i18n";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "El Tafouk",
    template: "%s | El Tafouk",
  },
  description: "El Tafouk books storefront with smart filtering and direct WhatsApp ordering.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const localeHeader = requestHeaders.get("x-next-intl-locale");
  const locale: Locale = hasLocale(routing.locales, localeHeader)
    ? localeHeader
    : defaultLocale;

  return (
    <html lang={locale} dir={getDirection(locale)}>
      <body className={`${cairo.variable} antialiased`}>{children}</body>
    </html>
  );
}

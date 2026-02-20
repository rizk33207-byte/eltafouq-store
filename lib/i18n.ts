import type { Locale } from "./types";

export const locales: Locale[] = ["ar", "en"];
export type { Locale };
export const defaultLocale: Locale = "ar";

export const isLocale = (value: string | null | undefined): value is Locale =>
  value !== null && value !== undefined && locales.includes(value as Locale);

export const getDirection = (locale: Locale): "rtl" | "ltr" =>
  locale === "ar" ? "rtl" : "ltr";

export const withLocalePath = (locale: Locale, path: string): string =>
  `/${locale}${path.startsWith("/") ? path : `/${path}`}`;

import type { Locale } from "./types";

const getLocaleCode = (locale: Locale): string => (locale === "ar" ? "ar-EG" : "en-US");

export const formatDateTime = (
  value: string | number | Date,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "short",
    timeStyle: "short",
  },
): string => new Intl.DateTimeFormat(getLocaleCode(locale), options).format(new Date(value));

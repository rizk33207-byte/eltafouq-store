import type { BookFilters, Grade, Lang, Locale, Subject } from "./types";

export const brandNames: Record<Locale, string> = {
  ar: "التفوق",
  en: "El Tafouk",
};

export const gradeLabels: Record<Locale, Record<Grade, string>> = {
  ar: {
    g1: "الصف الأول الثانوي",
    g2: "الصف الثاني الثانوي",
    g3: "الصف الثالث الثانوي",
  },
  en: {
    g1: "First Secondary Grade",
    g2: "Second Secondary Grade",
    g3: "Third Secondary Grade",
  },
};

export const languageLabels: Record<Locale, Record<Lang, string>> = {
  ar: {
    ar: "العربية",
    en: "English",
  },
  en: {
    ar: "Arabic",
    en: "English",
  },
};

export const subjectLabels: Record<Locale, Record<Subject, string>> = {
  ar: {
    bio: "الأحياء",
    phy: "الفيزياء",
    chem: "الكيمياء",
  },
  en: {
    bio: "Biology",
    phy: "Physics",
    chem: "Chemistry",
  },
};

export const getGradeLabel = (grade: Grade, locale: Locale = "ar"): string =>
  gradeLabels[locale][grade];
export const getLanguageLabel = (
  language: Lang,
  locale: Locale = "ar",
): string => languageLabels[locale][language];
export const getSubjectLabel = (
  subject: Subject,
  locale: Locale = "ar",
): string => subjectLabels[locale][subject];

export const getBrandName = (locale: Locale = "ar"): string =>
  brandNames[locale];

export const formatPriceEGP = (price: number, locale: Locale = "ar"): string =>
  `${new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US").format(price)} EGP`;

export const toBooksQuery = (filters: BookFilters): string => {
  const params = new URLSearchParams();

  if (filters.grade) {
    params.set("grade", filters.grade);
  }

  if (filters.lang) {
    params.set("lang", filters.lang);
  }

  if (filters.subject) {
    params.set("subject", filters.subject);
  }

  return params.toString();
};

export const cn = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(" ");

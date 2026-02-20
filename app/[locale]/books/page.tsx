import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import BookCard from "@/components/BookCard";
import {
  getBooks,
  parseBookFilters,
} from "@/lib/api";
import type { Locale } from "@/lib/i18n";
import type { BookFilters, Grade, Lang, Subject } from "@/lib/types";
import {
  getBrandName,
  getGradeLabel,
  getLanguageLabel,
  getSubjectLabel,
  toBooksQuery,
} from "@/lib/utils";

interface BooksPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const buildActiveFilters = (
  filters: BookFilters,
  locale: Locale,
): Array<{ key: string; value: string }> => {
  const items: Array<{ key: string; value: string }> = [];

  if (filters.grade) {
    items.push({
      key: "grade",
      value: getGradeLabel(filters.grade as Grade, locale),
    });
  }

  if (filters.lang) {
    items.push({
      key: "lang",
      value: getLanguageLabel(filters.lang as Lang, locale),
    });
  }

  if (filters.subject) {
    items.push({
      key: "subject",
      value: getSubjectLabel(filters.subject as Subject, locale),
    });
  }

  return items;
};

export async function generateMetadata({
  params,
}: BooksPageProps): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const brandName = getBrandName(typedLocale);

  if (typedLocale === "en") {
    return {
      title: "Books",
      description: `Browse ${brandName} books by grade, language and subject.`,
    };
  }

  return {
    title: "الكتب",
    description: "تصفح كتب تفوق حسب الصف واللغة والمادة من خلال القائمة الرئيسية.",
  };
}

export default async function BooksPage({ params, searchParams }: BooksPageProps) {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  setRequestLocale(typedLocale);
  const t = await getTranslations({ locale: typedLocale, namespace: "BooksPage" });

  const resolvedSearchParams = await searchParams;
  const filters = parseBookFilters(resolvedSearchParams);
  const { data: books } = await getBooks(filters);
  const activeFilters = buildActiveFilters(filters, typedLocale);
  const contextQuery = toBooksQuery(filters);

  return (
    <main className="page-enter mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 space-y-3">
        <span className="inline-flex rounded-full border border-sky-300/25 bg-sky-400/12 px-3 py-1 text-xs font-bold text-sky-300">
          {t("badge")}
        </span>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{t("title")}</h1>
        <p className="max-w-2xl text-ink-soft">{t("description")}</p>
      </header>

      {activeFilters.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <span
              key={filter.key}
              className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-semibold text-ink"
            >
              {filter.value}
            </span>
          ))}
        </div>
      ) : null}

      <section className="mt-6">
        {books.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {books.map((book) => (
              <BookCard key={book.id} book={book} contextQuery={contextQuery} />
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-10 text-center">
            <h2 className="text-xl font-bold text-ink">{t("noResultsTitle")}</h2>
            <p className="mt-2 text-sm text-ink-soft">{t("noResultsDescription")}</p>
            <Link
              href={`/${typedLocale}/books`}
              className="focus-visible-ring mt-4 inline-flex rounded-xl bg-linear-to-l from-brand to-brand-strong px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.02]"
            >
              {t("resetFilters")}
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

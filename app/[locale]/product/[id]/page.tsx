import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import ProductActions from "@/components/ProductActions";
import { getBookById, parseBookFilters } from "@/lib/api";
import type { Locale } from "@/lib/i18n";
import {
  formatPriceEGP,
  getGradeLabel,
  getLanguageLabel,
  getSubjectLabel,
  toBooksQuery,
} from "@/lib/utils";

interface ProductPageParams {
  locale: string;
  id: string;
}

interface ProductMetadataProps {
  params: Promise<ProductPageParams>;
}

interface ProductPageProps {
  params: Promise<ProductPageParams>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: ProductMetadataProps): Promise<Metadata> {
  const { id, locale } = await params;
  const typedLocale = locale as Locale;
  const book = await getBookById(id);
  const t = await getTranslations({
    locale: typedLocale,
    namespace: "Metadata",
  });

  if (!book) {
    return {
      title: t("productNotFoundTitle"),
      description: t("productNotFoundDescription"),
    };
  }

  return {
    title: book.title,
    description:
      typedLocale === "ar"
        ? `تفاصيل كتاب ${book.title} وسعره وطلبه عبر واتساب.`
        : `Book details for ${book.title}, including price and WhatsApp ordering.`,
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: ProductPageProps) {
  const { id, locale } = await params;
  const typedLocale = locale as Locale;
  setRequestLocale(typedLocale);
  const t = await getTranslations({ locale: typedLocale, namespace: "ProductPage" });

  const book = await getBookById(id);

  if (!book) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const backFilters = parseBookFilters(resolvedSearchParams);
  const backQuery = toBooksQuery(backFilters);
  const backHref = backQuery
    ? `/${typedLocale}/books?${backQuery}`
    : `/${typedLocale}/books`;

  const galleryItems = [book.image, book.image, book.image];

  return (
    <main className="page-enter mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5">
        <Link
          href={backHref}
          className="focus-visible-ring inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-4 py-2 text-sm font-semibold text-sky-300 transition-colors hover:bg-white/15"
        >
          <span aria-hidden="true" className="inline-flex h-5 w-5 items-center justify-center">
            ←
          </span>
          {t("backToResults")}
        </Link>
      </div>

      <div className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-4">
          <div className="glass-panel relative aspect-4/5 overflow-hidden rounded-3xl">
            <Image
              src={book.image}
              alt={book.title}
              fill
              sizes="(max-width: 1024px) 100vw, 54vw"
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#050916]/80 via-transparent to-transparent" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {galleryItems.map((image, index) => (
              <div
                key={`${book.id}-${index}`}
                className="glass-panel relative aspect-4/5 overflow-hidden rounded-xl"
              >
                <Image
                  src={image}
                  alt={`${book.title} preview ${index + 1}`}
                  fill
                  sizes="(max-width: 1024px) 33vw, 18vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>

        <article className="glass-panel rounded-3xl p-6 sm:p-8">
          <span className="inline-flex rounded-full border border-sky-300/25 bg-sky-400/12 px-3 py-1 text-xs font-bold text-sky-300">
            {t("detailsBadge")}
          </span>
          <h1 className="mt-4 text-2xl font-extrabold leading-10 text-ink sm:text-3xl">
            {book.title}
          </h1>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full border border-sky-300/20 bg-sky-400/12 px-2 py-1 text-sky-300">
              {getGradeLabel(book.grade, typedLocale)}
            </span>
            <span className="rounded-full border border-violet-300/20 bg-violet-400/14 px-2 py-1 text-violet-300">
              {getLanguageLabel(book.language, typedLocale)}
            </span>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-400/14 px-2 py-1 text-emerald-300">
              {getSubjectLabel(book.subject, typedLocale)}
            </span>
          </div>

          <p className="mt-4 text-2xl font-extrabold text-sky-300">
            {formatPriceEGP(book.price, typedLocale)}
          </p>

          <p className="mt-5 leading-8 text-ink-soft">{book.description}</p>

          <ProductActions book={book} locale={typedLocale} backHref={backHref} />
        </article>
      </div>
    </main>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import BookCard from "@/components/BookCard";
import RevealOnScroll from "@/components/RevealOnScroll";
import SectionHeader from "@/components/SectionHeader";
import { getBooks } from "@/lib/api";
import type { Locale } from "@/lib/i18n";
import { gradeValues } from "@/lib/types";
import { cn, getBrandName, getGradeLabel } from "@/lib/utils";
import { WHATSAPP_BASE_LINK } from "@/lib/whatsapp";

type HeroIconName = "physics" | "bio" | "chem" | "lang";

interface HeroCard {
  title: string;
  subtitle: string;
  icon: HeroIconName;
  iconContainerClass: string;
}

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const brandName = getBrandName(typedLocale);

  if (typedLocale === "en") {
    return {
      title: "Home",
      description:
        `Premium secondary books from ${brandName} with WhatsApp ordering and smart filtering.`,
    };
  }

  return {
    title: "الرئيسية",
    description:
      `كتب ${brandName} للمرحلة الثانوية بتصميم حديث وطلب مباشر عبر واتساب مع تصفح سريع حسب الصف.`,
  };
}

const HeroIcon = ({ icon }: { icon: HeroIconName }) => {
  if (icon === "physics") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
        <path
          d="M12 3.5v17m-8.5-8.5h17m-14 5.5a8.5 8.5 0 1 1 0-11m11 11a8.5 8.5 0 1 0 0-11"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (icon === "bio") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
        <path
          d="M8 4.5c5.5 0 8 3.4 8 7.5s-2.5 7.5-8 7.5m8-15c-5.5 0-8 3.4-8 7.5s2.5 7.5 8 7.5m-7-11h6m-7 6h6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "chem") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
        <path
          d="M9 3.75h6m-5 0v5.25l-4.9 8.1A2 2 0 0 0 6.82 20h10.36a2 2 0 0 0 1.72-2.9L14 9V3.75m-5.75 9.75h7.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path
        d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5m-17 0h17m-8.5-8.5c2 2.1 3.25 5.05 3.25 8.5s-1.25 6.4-3.25 8.5m0-17c-2 2.1-3.25 5.05-3.25 8.5s1.25 6.4 3.25 8.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  setRequestLocale(typedLocale);
  const t = await getTranslations({ locale: typedLocale, namespace: "Home" });
  const tSection = await getTranslations({ locale: typedLocale, namespace: "Section" });

  const { data: featuredBooks } = await getBooks({ featured: true });

  const heroCards: HeroCard[] = [
    {
      title: t("physics"),
      subtitle: t("threeGrades"),
      icon: "physics",
      iconContainerClass:
        "bg-[linear-gradient(145deg,rgba(86,109,255,0.38),rgba(124,71,255,0.22))]",
    },
    {
      title: t("bio"),
      subtitle: t("threeGrades"),
      icon: "bio",
      iconContainerClass:
        "bg-[linear-gradient(145deg,rgba(22,198,178,0.35),rgba(43,202,126,0.2))]",
    },
    {
      title: t("lang"),
      subtitle: t("langSubtitle"),
      icon: "lang",
      iconContainerClass:
        "bg-[linear-gradient(145deg,rgba(32,140,255,0.34),rgba(29,197,255,0.2))]",
    },
    {
      title: t("chem"),
      subtitle: t("threeGrades"),
      icon: "chem",
      iconContainerClass:
        "bg-[linear-gradient(145deg,rgba(175,92,255,0.34),rgba(236,72,153,0.2))]",
    },
  ];

  const gradeNumberClassMap: Record<string, string> = {
    g1: "bg-sky-400/90 text-sky-50",
    g2: "bg-violet-400/90 text-violet-50",
    g3: "bg-pink-500/90 text-pink-50",
  };

  const trustItems = [
    { title: t("trust1Title"), description: t("trust1Desc") },
    { title: t("trust2Title"), description: t("trust2Desc") },
    { title: t("trust3Title"), description: t("trust3Desc") },
  ];

  const heroCardDelayClasses = [
    "anim-delay-0",
    "anim-delay-450",
    "anim-delay-900",
    "anim-delay-1350",
  ] as const;
  const heroIconDelayClasses = [
    "anim-delay-0",
    "anim-delay-700",
    "anim-delay-1400",
    "anim-delay-2100",
  ] as const;
  const gradeCardDelayClasses = [
    "anim-delay-0",
    "anim-delay-350",
    "anim-delay-700",
  ] as const;
  const trustCardDelayClasses = [
    "anim-delay-0",
    "anim-delay-300",
    "anim-delay-600",
  ] as const;

  return (
    <main className="page-enter">
      <section className="relative overflow-hidden pb-14 pt-8 sm:pt-12 lg:pt-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(circle_at_32%_38%,rgba(39,129,255,0.22),transparent_42%),radial-gradient(circle_at_72%_52%,rgba(136,86,255,0.16),transparent_44%)]" />

        <div className="mx-auto w-full max-w-[1700px] px-4 sm:px-6">
          <div className="grid items-center gap-10 xl:grid-cols-12 xl:[direction:ltr]">
            <div className="relative order-2 xl:order-1 xl:col-span-5 xl:[direction:rtl]">
              <div className="pointer-events-none absolute inset-0 hidden md:block">
                <svg viewBox="0 0 100 100" className="h-full w-full">
                  <defs>
                    <linearGradient id="heroLine" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(64,191,255,0.4)" />
                      <stop offset="100%" stopColor="rgba(161,91,255,0.42)" />
                    </linearGradient>
                  </defs>
                  <line x1="25" y1="30" x2="25" y2="74" stroke="url(#heroLine)" strokeWidth="1" />
                  <line x1="75" y1="30" x2="75" y2="74" stroke="url(#heroLine)" strokeWidth="1" />
                  <line x1="25" y1="52" x2="75" y2="52" stroke="url(#heroLine)" strokeWidth="1" />
                </svg>
              </div>

              <div className="relative z-10 grid grid-cols-2 gap-4 sm:gap-5">
                {heroCards.map((card, index) => (
                  <article
                    key={card.title}
                    className={cn(
                      "soft-card-hover floating-card glass-panel group relative flex min-h-52 flex-col justify-between rounded-3xl p-5 sm:min-h-[230px]",
                      heroCardDelayClasses[index],
                    )}
                  >
                    <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[linear-gradient(130deg,rgba(255,255,255,0.08),transparent_35%,rgba(103,128,255,0.09)_100%)] opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
                    <span
                      className={cn(
                        "floating-icon relative inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 text-ink",
                        card.iconContainerClass,
                        heroIconDelayClasses[index],
                      )}
                    >
                      <HeroIcon icon={card.icon} />
                    </span>
                    <div className="relative">
                      <h3 className="text-2xl font-bold text-ink">{card.title}</h3>
                      <p className="mt-1 text-xl font-semibold text-ink-soft">{card.subtitle}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="relative order-1 text-right xl:order-2 xl:col-span-7 xl:pe-10 xl:[direction:rtl]">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/25 bg-blue-400/12 px-4 py-2 text-sm font-semibold text-sky-300">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-sky-400/20">
                  ★
                </span>
                {t("badge")}
              </span>

              <h1 className="mt-6 text-4xl font-extrabold leading-tight text-ink sm:text-5xl lg:text-6xl">
                <span className="bg-linear-to-l from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
                  {t("headingHighlight")}
                </span>
                <br />
                {t("headingRest")}
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-9 text-ink-soft">{t("description")}</p>

              <div className="mt-8 flex flex-wrap items-center gap-8">
                <div>
                  <p className="text-5xl font-extrabold text-cyan-300">3</p>
                  <p className="text-base text-ink-soft">{t("subjects")}</p>
                </div>
                <div>
                  <p className="text-5xl font-extrabold text-violet-300">3</p>
                  <p className="text-base text-ink-soft">{t("grades")}</p>
                </div>
                <div>
                  <p className="text-5xl font-extrabold text-blue-300">50K+</p>
                  <p className="text-base text-ink-soft">{t("students")}</p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/${typedLocale}/books`}
                  className="focus-visible-ring inline-flex items-center gap-2 rounded-2xl bg-linear-to-l from-[#3f7dff] to-[#7b49ff] px-6 py-3.5 text-base font-semibold text-white shadow-[0_0_26px_rgba(101,86,255,0.45)] transition-all duration-200 hover:scale-[1.03]"
                >
                  <span aria-hidden="true">←</span>
                  {t("ctaBrowse")}
                </Link>
                <a
                  href={WHATSAPP_BASE_LINK}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="focus-visible-ring inline-flex items-center gap-2 rounded-2xl bg-[#1fca65] px-6 py-3.5 text-base font-semibold text-white shadow-[0_0_24px_rgba(31,202,101,0.35)] transition-all duration-200 hover:scale-[1.03] hover:bg-[#1ab65a]"
                >
                  {t("ctaWhatsApp")}
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                    <path d="M20.5 3.5A11.4 11.4 0 0 0 2.9 17.1L1.5 22.5l5.6-1.4A11.4 11.4 0 0 0 22.5 12c0-3-1.2-5.8-3.5-8.5ZM12 21a8.7 8.7 0 0 1-4.4-1.2l-.3-.2-3.3.8.9-3.2-.2-.4A8.7 8.7 0 1 1 12 21Zm4.8-6.5c-.3-.2-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.1l-.8 1c-.1.1-.3.2-.5.1-.3-.2-1.2-.4-2.3-1.4-.8-.7-1.3-1.6-1.5-1.9-.2-.3 0-.4.1-.5l.4-.5.2-.3.1-.3c0-.1 0-.3-.1-.4l-.9-2.1c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.5 3.9 3.5.5.2 1 .4 1.3.5.6.2 1.1.2 1.5.1.4-.1 1.6-.7 1.8-1.3.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3Z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <RevealOnScroll>
        <section className="mx-auto w-full max-w-[1700px] px-4 py-10 sm:px-6">
          <SectionHeader
            badge={tSection("brand")}
            title={t("quickGradeTitle")}
            subtitle={t("quickGradeSubtitle")}
          />
          <div className="grid gap-5 lg:grid-cols-3">
            {gradeValues.map((grade, index) => (
              <Link
                key={grade}
                href={`/${typedLocale}/books?grade=${grade}`}
                className={cn(
                  "soft-card-hover glass-panel floating-card group relative overflow-hidden rounded-3xl p-6 sm:p-7",
                  gradeCardDelayClasses[index],
                )}
              >
                <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,rgba(255,255,255,0.07),transparent_36%,rgba(93,129,255,0.14)_100%)] opacity-60 transition-opacity duration-300 group-hover:opacity-90" />
                <div className="relative flex items-start justify-between gap-4">
                  <span
                    className={cn(
                      "inline-flex h-14 w-14 items-center justify-center rounded-full text-3xl font-black shadow-[0_0_16px_rgba(59,130,246,0.4)]",
                      gradeNumberClassMap[grade],
                    )}
                  >
                    {index + 1}
                  </span>
                </div>

                <h3 className="relative mt-9 text-4xl font-extrabold text-ink">
                  {getGradeLabel(grade, typedLocale)}
                </h3>
                <p className="relative mt-3 text-lg text-ink-soft">{t("gradeCardHint")}</p>

                <span className="relative mt-8 inline-flex items-center gap-2 text-lg font-bold text-cyan-300">
                  {t("ctaBrowse")}
                  <span aria-hidden="true">←</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section className="mx-auto w-full max-w-[1700px] px-4 py-10 sm:px-6">
          <SectionHeader
            badge={tSection("brand")}
            title={t("featuredTitle")}
            subtitle={t("featuredSubtitle")}
          />
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {featuredBooks.slice(0, 6).map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <section className="mx-auto w-full max-w-[1700px] px-4 pb-16 pt-10 sm:px-6">
          <SectionHeader
            badge={tSection("brand")}
            title={t("trustTitle")}
            subtitle={t("trustSubtitle")}
          />
          <div className="grid gap-4 md:grid-cols-3">
            {trustItems.map((item, index) => (
              <article
                key={item.title}
                className={cn(
                  "soft-card-hover glass-panel floating-card rounded-2xl p-5",
                  trustCardDelayClasses[index],
                )}
              >
                <h3 className="text-xl font-bold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-8 text-ink-soft">{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      </RevealOnScroll>
    </main>
  );
}

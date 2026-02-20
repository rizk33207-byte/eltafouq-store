"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  gradeValues,
  isGrade,
  subjectValues,
  type Lang,
  type Grade,
  type Subject,
} from "@/lib/types";
import { useCartStore } from "@/lib/cart-store";
import { isLocale, type Locale } from "@/lib/i18n";
import { cn, getBrandName, getGradeLabel, getSubjectLabel } from "@/lib/utils";
import { WHATSAPP_BASE_LINK } from "@/lib/whatsapp";

const gradeDotClass: Record<Grade, string> = {
  g1: "bg-sky-400",
  g2: "bg-violet-400",
  g3: "bg-pink-500",
};

const subjectIconClass: Record<Subject, string> = {
  bio: "bg-emerald-500/20 text-emerald-300",
  phy: "bg-blue-500/20 text-blue-300",
  chem: "bg-fuchsia-500/20 text-fuchsia-300",
};

const buildSubjectHref = (
  locale: Locale,
  grade: Grade,
  language: Lang,
  subject: Subject,
): string => {
  const params = new URLSearchParams({
    grade,
    lang: language,
    subject,
  });

  return `/${locale}/books?${params.toString()}`;
};

const CartIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
    <path
      d="M2.75 4.75h2.5l2.35 10h9.88l2.27-7.25H7.4M10 19.5a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Zm8 0a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    viewBox="0 0 20 20"
    className={cn("h-4 w-4 text-ink-soft transition-transform duration-200", open && "rotate-180")}
    aria-hidden="true"
  >
    <path
      d="M5.25 7.5 10 12.5 14.75 7.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  </svg>
);

const SubjectIcon = ({ subject }: { subject: Subject }) => {
  if (subject === "bio") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <path
          d="M8 4.5c5.5 0 8 3.4 8 7.5s-2.5 7.5-8 7.5m8-15c-5.5 0-8 3.4-8 7.5s2.5 7.5 8 7.5m-7-11h6m-7 6h6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (subject === "phy") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <path
          d="M12 3.5v17m-8.5-8.5h17m-14 5.5a8.5 8.5 0 1 1 0-11m11 11a8.5 8.5 0 1 0 0-11"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M9 3.75h6m-5 0v5.25l-4.9 8.1A2 2 0 0 0 6.82 20h10.36a2 2 0 0 0 1.72-2.9L14 9V3.75m-5.75 9.75h7.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale() as Locale;
  const t = useTranslations("Navbar");

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGrade, setOpenGrade] = useState<Grade | null>(null);
  const [mobileGrade, setMobileGrade] = useState<Grade | null>(null);
  const megaMenuRef = useRef<HTMLDivElement | null>(null);
  const hydrated = useCartStore((state) => state.hydrated);
  const cartCount = useCartStore((state) => state.count());

  const rawGrade = searchParams.get("grade");
  const currentGrade = isGrade(rawGrade) ? rawGrade : undefined;

  const switchLocale = locale === "ar" ? "en" : "ar";
  const switchLabel = locale === "ar" ? t("switchToEn") : t("switchToAr");
  const brandName = getBrandName(locale);

  const localeSwitchHref = useMemo(() => {
    const currentPathSegments = pathname.split("/").filter(Boolean);

    if (currentPathSegments.length === 0) {
      const query = searchParams.toString();
      return `/${switchLocale}${query ? `?${query}` : ""}`;
    }

    if (isLocale(currentPathSegments[0])) {
      currentPathSegments[0] = switchLocale;
    } else {
      currentPathSegments.unshift(switchLocale);
    }

    const query = searchParams.toString();
    return `/${currentPathSegments.join("/")}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams, switchLocale]);

  const closeMenu = () => setOpenGrade(null);

  const handleGradeToggle = (grade: Grade) => {
    setOpenGrade((current) => (current === grade ? null : grade));
  };

  useEffect(() => {
    if (!openGrade) {
      return;
    }

    const handleDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;

      if (!target) {
        return;
      }

      if (megaMenuRef.current?.contains(target)) {
        return;
      }

      const trigger = target instanceof Element ? target.closest("[data-grade-trigger='true']") : null;
      if (trigger) {
        return;
      }

      setOpenGrade(null);
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, [openGrade]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050917]/68 backdrop-blur-2xl">
      <div className="mx-auto w-full max-w-[1700px] px-4 sm:px-6">
        <div className="flex min-h-[78px] items-center gap-3">
          <Link
            href={`/${locale}`}
            className="focus-visible-ring inline-flex items-center gap-3 rounded-2xl px-1 py-1"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#4b72ff,#7c47ff)] text-white shadow-[0_0_26px_rgba(110,79,255,0.5)]">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-xl font-extrabold tracking-wide text-transparent bg-linear-to-l from-cyan-300 via-blue-300 to-violet-300 bg-clip-text">
              {brandName}
            </span>
          </Link>

          <nav className="hidden flex-1 items-center justify-center lg:flex">
            <div className="glass-panel relative flex items-center gap-2 rounded-2xl px-3 py-2">
              {gradeValues.map((grade) => {
                const isOpen = openGrade === grade;

                return (
                  <div key={grade}>
                    <button
                      type="button"
                      data-grade-trigger="true"
                      onClick={() => handleGradeToggle(grade)}
                      className={cn(
                        "focus-visible-ring inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200",
                        currentGrade === grade || isOpen
                          ? "bg-white/12 text-white"
                          : "text-ink-soft hover:bg-white/8 hover:text-ink",
                      )}
                    >
                      <span className={cn("h-2.5 w-2.5 rounded-full", gradeDotClass[grade])} />
                      <span>{getGradeLabel(grade, locale)}</span>
                      <ChevronIcon open={isOpen} />
                    </button>
                  </div>
                );
              })}

              <div
                className={cn(
                  "absolute top-[calc(100%+12px)] left-1/2 z-[60] w-[min(720px,calc(100vw-2rem))] -translate-x-1/2 rounded-3xl transition-all duration-300",
                  openGrade
                    ? "pointer-events-auto translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-2 opacity-0",
                )}
              >
                <div
                  ref={megaMenuRef}
                  role="menu"
                  onMouseDown={(event) => event.stopPropagation()}
                  className="glass-panel rounded-3xl p-5"
                >
                  <div className="grid gap-4 [direction:ltr] md:grid-cols-2">
                    <div className="space-y-3 [direction:rtl]">
                      <h3 className="border-b border-white/10 pb-2 text-right text-sm font-bold text-ink-soft">
                        {t("arabicColumn")}
                      </h3>
                      <div className="space-y-2">
                        {subjectValues.map((subject) => (
                          <Link
                            key={`ar-${subject}`}
                            href={
                              openGrade
                                ? buildSubjectHref(locale, openGrade, "ar", subject)
                                : "#"
                            }
                            onClick={closeMenu}
                            role="menuitem"
                            className="soft-card-hover focus-visible-ring flex items-center justify-between rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-ink-soft transition-all duration-200 hover:border-cyan-300/35 hover:bg-cyan-400/10 hover:text-ink"
                          >
                            <span>{getSubjectLabel(subject, "ar")}</span>
                            <span
                              className={cn(
                                "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10",
                                subjectIconClass[subject],
                              )}
                            >
                              <SubjectIcon subject={subject} />
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 [direction:ltr]">
                      <h3 className="border-b border-white/10 pb-2 text-left text-sm font-bold text-ink-soft">
                        {t("englishColumn")}
                      </h3>
                      <div className="space-y-2">
                        {subjectValues.map((subject) => (
                          <Link
                            key={`en-${subject}`}
                            href={
                              openGrade
                                ? buildSubjectHref(locale, openGrade, "en", subject)
                                : "#"
                            }
                            onClick={closeMenu}
                            role="menuitem"
                            className="soft-card-hover focus-visible-ring flex items-center justify-between rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-ink-soft transition-all duration-200 hover:border-cyan-300/35 hover:bg-cyan-400/10 hover:text-ink"
                          >
                            <span>{getSubjectLabel(subject, "en")}</span>
                            <span
                              className={cn(
                                "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10",
                                subjectIconClass[subject],
                              )}
                            >
                              <SubjectIcon subject={subject} />
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          <div className="ms-auto hidden items-center gap-2 md:flex">
            <Link
              href={localeSwitchHref}
              aria-label={t("switchLanguage")}
              className="focus-visible-ring rounded-xl border border-white/12 bg-white/8 px-4 py-2 text-sm font-bold text-ink-soft transition-colors hover:bg-white/15 hover:text-ink"
            >
              {switchLabel}
            </Link>
            <Link
              href={`/${locale}/track`}
              className="focus-visible-ring rounded-xl border border-white/12 bg-white/8 px-4 py-2 text-sm font-bold text-ink-soft transition-colors hover:bg-white/15 hover:text-ink"
            >
              {t("trackOrder")}
            </Link>
            <Link
              href={`/${locale}/cart`}
              aria-label={t("cart")}
              className="focus-visible-ring relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/8 text-ink-soft transition-colors hover:bg-white/15 hover:text-ink"
            >
              <CartIcon />
              {hydrated && cartCount > 0 ? (
                <span className="absolute -left-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full border border-violet-300/40 bg-violet-500/90 px-1 text-[10px] font-bold leading-5 text-white shadow-[0_0_14px_rgba(168,85,247,0.75)]">
                  {cartCount}
                </span>
              ) : null}
            </Link>
            <a
              href={WHATSAPP_BASE_LINK}
              target="_blank"
              rel="noreferrer noopener"
              className="focus-visible-ring inline-flex items-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-500/16 px-4 py-2 text-sm font-semibold text-emerald-300 transition-all duration-200 hover:scale-[1.02] hover:bg-emerald-500/28"
            >
              <span>{t("whatsapp")}</span>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-200">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                  <path d="M20.5 3.5A11.4 11.4 0 0 0 2.9 17.1L1.5 22.5l5.6-1.4A11.4 11.4 0 0 0 22.5 12c0-3-1.2-5.8-3.5-8.5ZM12 21a8.7 8.7 0 0 1-4.4-1.2l-.3-.2-3.3.8.9-3.2-.2-.4A8.7 8.7 0 1 1 12 21Zm4.8-6.5c-.3-.2-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.1l-.8 1c-.1.1-.3.2-.5.1-.3-.2-1.2-.4-2.3-1.4-.8-.7-1.3-1.6-1.5-1.9-.2-.3 0-.4.1-.5l.4-.5.2-.3.1-.3c0-.1 0-.3-.1-.4l-.9-2.1c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.5 3.9 3.5.5.2 1 .4 1.3.5.6.2 1.1.2 1.5.1.4-.1 1.6-.7 1.8-1.3.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3Z" />
                </svg>
              </span>
            </a>
          </div>

          <button
            type="button"
            aria-label={t("openMenu")}
            onClick={() => setMobileOpen((value) => !value)}
            className="focus-visible-ring ms-auto inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/8 text-ink md:hidden"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
              <path
                d="M3.75 5.75h12.5M3.75 10h12.5M3.75 14.25h12.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div
          className={cn(
            "overflow-hidden transition-all duration-300 md:hidden",
            mobileOpen ? "max-h-[640px] pb-4 opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <div className="glass-panel space-y-3 rounded-2xl p-4">
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={localeSwitchHref}
                onClick={() => setMobileOpen(false)}
                className="focus-visible-ring inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-white/14"
              >
                {switchLabel}
              </Link>
              <Link
                href={`/${locale}/track`}
                onClick={() => setMobileOpen(false)}
                className="focus-visible-ring inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-white/14"
              >
                {t("trackOrder")}
              </Link>
              <Link
                href={`/${locale}/cart`}
                onClick={() => setMobileOpen(false)}
                className="focus-visible-ring inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-white/14"
              >
                {t("cart")}
                {hydrated && cartCount > 0 ? (
                  <span className="ms-1 rounded-full bg-violet-500 px-1.5 text-[10px] text-white">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
              <a
                href={WHATSAPP_BASE_LINK}
                target="_blank"
                rel="noreferrer noopener"
                className="focus-visible-ring inline-flex items-center justify-center rounded-xl bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/30"
              >
                {t("whatsapp")}
              </a>
            </div>

            <div className="grid gap-2">
              {gradeValues.map((grade) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() =>
                    setMobileGrade((current) => (current === grade ? null : grade))
                  }
                  className={cn(
                    "focus-visible-ring inline-flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                    currentGrade === grade || mobileGrade === grade
                      ? "border-white/25 bg-white/12 text-ink"
                      : "border-white/10 bg-white/6 text-ink-soft hover:bg-white/12 hover:text-ink",
                  )}
                >
                  <span>{getGradeLabel(grade, locale)}</span>
                  <span className="inline-flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full", gradeDotClass[grade])} />
                    <ChevronIcon open={mobileGrade === grade} />
                  </span>
                </button>
              ))}
            </div>

            {mobileGrade ? (
              <div className="glass-panel rounded-2xl p-3" role="menu">
                <div className="grid gap-3 [direction:ltr] sm:grid-cols-2">
                  <div className="[direction:rtl] space-y-2">
                    <p className="border-b border-white/10 pb-2 text-sm font-bold text-ink-soft">
                      {t("arabicColumn")}
                    </p>
                    {subjectValues.map((subject) => (
                      <Link
                        key={`mobile-ar-${subject}`}
                        href={buildSubjectHref(locale, mobileGrade, "ar", subject)}
                        role="menuitem"
                        onClick={() => {
                          setMobileOpen(false);
                          setOpenGrade(null);
                          setMobileGrade(null);
                        }}
                        className="focus-visible-ring flex items-center justify-between rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-cyan-300/35 hover:bg-cyan-400/10 hover:text-ink"
                      >
                        <span>{getSubjectLabel(subject, "ar")}</span>
                        <span
                          className={cn(
                            "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10",
                            subjectIconClass[subject],
                          )}
                        >
                          <SubjectIcon subject={subject} />
                        </span>
                      </Link>
                    ))}
                  </div>

                  <div className="[direction:ltr] space-y-2">
                    <p className="border-b border-white/10 pb-2 text-sm font-bold text-ink-soft">
                      {t("englishColumn")}
                    </p>
                    {subjectValues.map((subject) => (
                      <Link
                        key={`mobile-en-${subject}`}
                        href={buildSubjectHref(locale, mobileGrade, "en", subject)}
                        role="menuitem"
                        onClick={() => {
                          setMobileOpen(false);
                          setOpenGrade(null);
                          setMobileGrade(null);
                        }}
                        className="focus-visible-ring flex items-center justify-between rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-cyan-300/35 hover:bg-cyan-400/10 hover:text-ink"
                      >
                        <span>{getSubjectLabel(subject, "en")}</span>
                        <span
                          className={cn(
                            "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10",
                            subjectIconClass[subject],
                          )}
                        >
                          <SubjectIcon subject={subject} />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {openGrade ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-40 bg-black/8 backdrop-blur-[1px]"
        />
      ) : null}
    </header>
  );
}


"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/lib/i18n";

interface AdminLoginFormProps {
  locale: Locale;
  nextPath?: string;
}

const resolveNextPath = (locale: Locale, nextPath?: string): string => {
  if (!nextPath) {
    return `/${locale}/admin`;
  }

  if (!nextPath.startsWith(`/${locale}/admin`)) {
    return `/${locale}/admin`;
  }

  return nextPath;
};

export default function AdminLoginForm({ locale, nextPath }: AdminLoginFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetPath = useMemo(
    () => resolveNextPath(locale, nextPath),
    [locale, nextPath],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password || submitting) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      if (!response.ok) {
        setError(t("admin.login.error"));
        return;
      }

      router.push(targetPath);
      router.refresh();
    } catch {
      setError(t("admin.login.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page-enter mx-auto flex min-h-[70vh] w-full max-w-xl items-center px-4 py-10 sm:px-6">
      <section className="glass-panel w-full rounded-3xl p-6 sm:p-8">
        <span className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-500/12 px-3 py-1 text-xs font-bold text-cyan-300">
          {t("admin.login.badge")}
        </span>

        <h1 className="mt-4 text-3xl font-extrabold text-ink">{t("admin.login.title")}</h1>
        <p className="mt-2 text-sm text-ink-soft">{t("admin.login.description")}</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">
              {t("admin.login.emailLabel")}
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="focus-visible-ring w-full rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft/70"
              placeholder={t("admin.login.emailPlaceholder")}
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">
              {t("admin.login.passwordLabel")}
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="focus-visible-ring w-full rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft/70"
              placeholder={t("admin.login.passwordPlaceholder")}
              autoComplete="current-password"
            />
          </label>

          {error ? (
            <p className="rounded-xl border border-rose-300/35 bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="focus-visible-ring inline-flex min-w-36 items-center justify-center rounded-xl bg-linear-to-l from-brand to-brand-strong px-5 py-3 text-sm font-bold text-white transition-transform duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? t("admin.login.submitting") : t("admin.login.button")}
          </button>
        </form>

        <div className="mt-6 border-t border-white/10 pt-4">
          <Link
            href={`/${locale}`}
            className="text-sm font-semibold text-cyan-300 transition-colors hover:text-cyan-200"
          >
            {t("admin.actions.backToSite")}
          </Link>
        </div>
      </section>
    </main>
  );
}

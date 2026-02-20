"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  locale: Locale;
  title: string;
  description?: string;
  children: React.ReactNode;
}

const navItems = (locale: Locale) => [
  { href: `/${locale}/admin`, key: "dashboard" },
  { href: `/${locale}/admin/orders`, key: "orders" },
  { href: `/${locale}/admin/books`, key: "books" },
];

export default function AdminShell({
  locale,
  title,
  description,
  children,
}: AdminShellProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);
      await fetch("/api/admin/auth/logout", {
        method: "POST",
      });
    } finally {
      router.push(`/${locale}/admin/login`);
      router.refresh();
      setLoggingOut(false);
    }
  };

  return (
    <main className="page-enter mx-auto w-full max-w-[1700px] px-4 py-8 sm:px-6">
      <section className="glass-panel rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{title}</h1>
            {description ? <p className="mt-1 text-sm text-ink-soft">{description}</p> : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {navItems(locale).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "focus-visible-ring rounded-xl border px-4 py-2 text-sm font-semibold transition-colors",
                  pathname === item.href
                    ? "border-cyan-300/35 bg-cyan-500/18 text-cyan-200"
                    : "border-white/15 bg-white/8 text-ink-soft hover:bg-white/12 hover:text-ink",
                )}
              >
                {t(`admin.nav.${item.key}`)}
              </Link>
            ))}

            <button
              type="button"
              onClick={handleLogout}
              className="focus-visible-ring rounded-xl border border-rose-300/35 bg-rose-500/16 px-4 py-2 text-sm font-semibold text-rose-200 transition-colors hover:bg-rose-500/26"
            >
              {loggingOut ? t("admin.actions.logoutLoading") : t("admin.actions.logout")}
            </button>
          </div>
        </div>
      </section>

      <section className="mt-5">{children}</section>
    </main>
  );
}

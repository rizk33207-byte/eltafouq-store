"use client";

import { useTranslations } from "next-intl";
import { WHATSAPP_BASE_LINK } from "@/lib/whatsapp";

export default function WhatsAppButton() {
  const t = useTranslations("WhatsApp");

  return (
    <a
      href={WHATSAPP_BASE_LINK}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={t("aria")}
      className="focus-visible-ring whatsapp-pulse fixed bottom-5 left-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full border border-emerald-300/35 bg-linear-to-b from-emerald-500 to-emerald-600 text-white shadow-[0_12px_24px_rgba(31,202,101,0.45)] transition-transform duration-200 hover:scale-105"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-7 w-7 fill-current"
        focusable="false"
      >
        <path d="M20.5 3.5A11.4 11.4 0 0 0 2.9 17.1L1.5 22.5l5.6-1.4A11.4 11.4 0 0 0 22.5 12c0-3-1.2-5.8-3.5-8.5ZM12 21a8.7 8.7 0 0 1-4.4-1.2l-.3-.2-3.3.8.9-3.2-.2-.4A8.7 8.7 0 1 1 12 21Zm4.8-6.5c-.3-.2-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.1l-.8 1c-.1.1-.3.2-.5.1-.3-.2-1.2-.4-2.3-1.4-.8-.7-1.3-1.6-1.5-1.9-.2-.3 0-.4.1-.5l.4-.5.2-.3.1-.3c0-.1 0-.3-.1-.4l-.9-2.1c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.5 3.9 3.5.5.2 1 .4 1.3.5.6.2 1.1.2 1.5.1.4-.1 1.6-.7 1.8-1.3.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3Z" />
      </svg>
    </a>
  );
}


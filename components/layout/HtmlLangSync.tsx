"use client";

import { useEffect } from "react";
import { useLanguage } from "@/lib/i18n/context";

/**
 * Keeps <html lang="..."> in sync with the active locale.
 *
 * The root layout is a Server Component, so it cannot read locale state
 * directly. This lightweight client component mounts inside LanguageProvider
 * and patches document.documentElement.lang whenever the locale changes.
 * It renders nothing visible.
 */
export function HtmlLangSync() {
  const { locale } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}

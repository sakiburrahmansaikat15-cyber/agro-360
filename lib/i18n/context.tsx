"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translations, type Locale } from "./translations";
import { HtmlLangSync } from "@/components/layout/HtmlLangSync";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "agro-trust-360-locale";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("bn");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "bn") {
      // Hydration-safe: default renders "bn" on the server, then swaps to the
      // persisted preference once we can read localStorage on the client.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "bn" ? "en" : "bn");
  }, [locale, setLocale]);

  const value = useMemo(() => ({ locale, setLocale, toggleLocale }), [locale, setLocale, toggleLocale]);

  return (
    <LanguageContext.Provider value={value}>
      <HtmlLangSync />
      <div lang={locale} className={locale === "bn" ? "font-bn" : "font-sans"}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

function resolvePath(obj: unknown, path: string): string {
  const result = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
  return typeof result === "string" ? result : path;
}

export function useT() {
  const { locale } = useLanguage();
  return useMemo(() => {
    const dict = translations[locale];
    return (path: string) => resolvePath(dict, path);
  }, [locale]);
}

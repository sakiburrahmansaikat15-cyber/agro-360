"use client";

import { Leaf, Languages } from "lucide-react";
import { useLanguage, useT } from "@/lib/i18n/context";

export function TraceTopBar() {
  const t = useT();
  const { locale, toggleLocale } = useLanguage();

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Leaf size={18} strokeWidth={2.2} />
        </span>
        <span className="text-sm font-semibold text-brand-900">{t("brand.name")}</span>
      </div>
      <button
        onClick={toggleLocale}
        className="flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
        aria-label="Toggle language"
      >
        <Languages size={13} />
        {locale === "bn" ? "বাংলা" : "EN"}
      </button>
    </div>
  );
}

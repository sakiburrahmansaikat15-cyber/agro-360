"use client";

import { Bell, Menu, Search, Languages } from "lucide-react";
import { useT, useLanguage } from "@/lib/i18n/context";
import { useUser } from "@/lib/context/UserContext";
import Link from "next/link";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const t = useT();
  const { locale, toggleLocale } = useLanguage();
  const { name, profilePicture } = useUser();

  const getInitials = (fullName: string) => {
    if (!fullName) return "?";
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="hidden min-w-0 flex-1 items-center sm:flex">
        <div className="relative w-full max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t("topbar.search")}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      <p className="hidden truncate text-xs font-medium text-slate-500 md:block">{t("topbar.role")}</p>

      <div className="ml-auto flex items-center gap-2 sm:ml-0">
        <span className="hidden items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 sm:inline-flex">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
          </span>
          {t("topbar.live")}
        </span>

        <button
          onClick={toggleLocale}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          aria-label="Toggle language"
        >
          <Languages size={14} />
          {locale === "bn" ? "বাংলা" : "EN"}
        </button>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        <Link
          href="/profile"
          className="ml-2 flex items-center gap-2 rounded-xl p-1 transition-colors hover:bg-slate-100"
        >
          <span className="hidden text-sm font-semibold text-slate-700 sm:block">
            {name}
          </span>
          {profilePicture ? (
            <img
              src={profilePicture}
              alt="User profile"
              className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold tracking-wider text-white">
              {getInitials(name)}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}

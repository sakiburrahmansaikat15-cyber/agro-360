"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { LayoutDashboard, Warehouse, QrCode, Rocket, Leaf, X, Map, Users } from "lucide-react";
import { useT } from "@/lib/i18n/context";

const navItems = [
  { href: "/", key: "nav.overview", icon: LayoutDashboard, section: "monitor" },
  { href: "/inventory", key: "nav.inventory", icon: Warehouse, section: "monitor" },
  { href: "/traceability", key: "nav.traceability", icon: QrCode, section: "monitor" },
  { href: "/map", key: "nav.map", icon: Map, section: "monitor" },
  { href: "/pilot", key: "nav.pilot", icon: Rocket, section: "program" },
  { href: "/admin", key: "nav.admin", icon: Users, section: "program" },
] as const;

export function Sidebar({ onNavigate, onClose }: { onNavigate?: () => void; onClose?: () => void }) {
  const pathname = usePathname();
  const t = useT();

  const monitorItems = navItems.filter((i) => i.section === "monitor");
  const programItems = navItems.filter((i) => i.section === "program");

  return (
    <div className="flex h-full flex-col bg-brand-950 text-brand-100">
      <div className="flex items-center gap-3 px-5 py-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/20 text-brand-300 ring-1 ring-inset ring-brand-400/30">
          <Leaf size={22} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-white">{t("brand.name")}</p>
          <p className="truncate text-[11px] leading-tight text-brand-300/80">{t("brand.tagline")}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-brand-200 hover:bg-brand-900/60 lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        <div>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-brand-400/70">
            {t("nav.section_monitor")}
          </p>
          <ul className="space-y-1">
            {monitorItems.map((item) => (
              <NavLink key={item.href} item={item} active={pathname === item.href} label={t(item.key)} onNavigate={onNavigate} />
            ))}
          </ul>
        </div>
        <div>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-brand-400/70">
            {t("nav.section_program")}
          </p>
          <ul className="space-y-1">
            {programItems.map((item) => (
              <NavLink key={item.href} item={item} active={pathname === item.href} label={t(item.key)} onNavigate={onNavigate} />
            ))}
          </ul>
        </div>
      </nav>

      <div className="border-t border-brand-800/60 px-5 py-4">
        <p className="text-[11px] leading-relaxed text-brand-400/70">
          Mystrix IT · Proposed to Government of Bangladesh
        </p>
      </div>
    </div>
  );
}

function NavLink({
  item,
  active,
  label,
  onNavigate,
}: {
  item: (typeof navItems)[number];
  active: boolean;
  label: string;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        className={clsx(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          active
            ? "bg-brand-500/15 text-white ring-1 ring-inset ring-brand-400/30"
            : "text-brand-200/80 hover:bg-brand-900/60 hover:text-white"
        )}
      >
        <Icon size={18} strokeWidth={2} className={active ? "text-brand-300" : "text-brand-400/70"} />
        {label}
      </Link>
    </li>
  );
}

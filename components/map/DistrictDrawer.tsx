"use client";

import { X, Warehouse, Users, TriangleAlert, Layers, MapPin, Leaf, ExternalLink, DatabaseZap, Clock } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { type DistrictMapData } from "@/lib/map-data";
import { RiskBadge } from "@/components/ui/Badge";
import { useT, useLanguage } from "@/lib/i18n/context";

type Props = {
  district: DistrictMapData | null;
  onClose: () => void;
};

export function DistrictDrawer({ district, onClose }: Props) {
  const open = district !== null;

  return (
    <>
      {/* Backdrop — only on mobile */}
      <div
        className={clsx(
          "fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        role="complementary"
        aria-label={district ? `${district.nameEn} district details` : "District details"}
        className={clsx(
          "absolute inset-y-0 right-0 z-40 flex w-full flex-col bg-white shadow-2xl ring-1 ring-slate-900/10 transition-transform duration-300 ease-out sm:w-[420px]",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {district ? <DrawerContent district={district} onClose={onClose} /> : null}
      </aside>
    </>
  );
}

function DrawerContent({ district, onClose }: { district: DistrictMapData; onClose: () => void }) {
  const t = useT();
  const { locale } = useLanguage();
  const nf = (n: number) => n.toLocaleString(locale === "bn" ? "bn-BD" : "en-US");

  const namePrimary = locale === "bn" ? district.nameBn : district.nameEn;
  const nameSecondary = locale === "bn" ? district.nameEn : district.nameBn;
  const divisionName = locale === "bn" ? district.divisionBn : district.divisionEn;

  return (
    <>
      {/* ── Header ── */}
      <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {namePrimary}
            </h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {nameSecondary}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin size={13} className="text-slate-400" />
              {divisionName} {locale === "bn" ? "বিভাগ" : "Division"}
            </span>
            {district.hasData ? (
              <RiskBadge level={district.risk} label={t(`inventory.risk_${district.risk}`)} />
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                {t("map.no_data_badge")}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label={t("map.close")}
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {!district.hasData ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <DatabaseZap size={20} />
            </span>
            <p className="text-sm font-semibold text-slate-700">{t("map.no_data_badge")}</p>
            <p className="max-w-[260px] text-xs text-slate-400">{t("map.no_data_desc")}</p>
          </div>
        ) : (
          <>
            {/* ── KPI grid ── */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                icon={<Warehouse size={16} className="text-brand-600" />}
                label={t("map.stock")}
                value={`${nf(district.stockMT)} ${t("common.tons")}`}
                bg="bg-brand-50"
              />
              <MetricCard
                icon={<Users size={16} className="text-teal-600" />}
                label={t("map.farmers")}
                value={nf(district.farmers)}
                bg="bg-teal-50"
              />
              <MetricCard
                icon={<Layers size={16} className="text-indigo-600" />}
                label={t("map.batches")}
                value={nf(district.batchCount)}
                bg="bg-indigo-50"
              />
              <MetricCard
                icon={<TriangleAlert size={16} className={district.alertsCount > 0 ? "text-red-500" : "text-slate-400"} />}
                label={t("map.price_alerts")}
                value={nf(district.alertsCount)}
                bg={district.alertsCount > 0 ? "bg-red-50" : "bg-slate-50"}
              />
            </div>

            {/* ── Alerts ── */}
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-100 p-4">
              <span
                className={clsx(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  district.alertsCount > 0 ? "bg-red-50 text-red-500" : "bg-brand-50 text-brand-600"
                )}
              >
                <TriangleAlert size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {district.alertsCount > 0
                    ? `${nf(district.alertsCount)} ${t("map.alerts_active")}`
                    : t("map.alerts_none")}
                </p>
                <p className="text-xs text-slate-400">
                  {district.alertsCount > 0
                    ? t("map.alerts_flagged")
                    : t("map.alerts_normal")}
                </p>
              </div>
            </div>

            {/* ── Primary crops ── */}
            <div className="mt-5">
              <h3 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Leaf size={12} />
                {t("map.primary_crops")}
              </h3>
              {district.primaryCropsEn.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {district.primaryCropsEn.map((crop) => (
                    <span
                      key={crop}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-200"
                    >
                      {crop}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">{t("map.no_crops")}</p>
              )}
            </div>

            {/* ── Last updated ── */}
            {district.lastUpdated && (
              <p className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400">
                <Clock size={11} />
                {t("map.last_updated")}: {new Date(district.lastUpdated).toLocaleString(locale === "bn" ? "bn-BD" : "en-US")}
              </p>
            )}
          </>
        )}

        {/* ── Division summary ── */}
        <div className="mt-5 rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {t("map.drawer_division")}
          </p>
          <p className="text-sm font-semibold text-slate-800">{namePrimary}</p>
          <p className="text-xs text-slate-400">{nameSecondary}</p>
        </div>
      </div>

      {/* ── Footer actions ── */}
      <div className="border-t border-slate-100 px-6 py-4">
        <Link
          href="/inventory"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          {t("map.view_inventory")}
          <ExternalLink size={14} />
        </Link>
        <button
          onClick={onClose}
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          {t("map.close")}
        </button>
      </div>
    </>
  );
}

function MetricCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
}) {
  return (
    <div className={clsx("rounded-xl p-3.5", bg)}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        {icon}
        {label}
      </div>
      <p className="mt-1.5 text-lg font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

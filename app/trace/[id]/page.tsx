"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Calendar,
  MapPin,
  Package,
  Snowflake,
  Sparkles,
  Thermometer,
  TriangleAlert,
  Clock,
} from "lucide-react";
import { TraceTopBar } from "@/components/trace/TraceTopBar";
import { VerifiedHero } from "@/components/trace/VerifiedHero";
import { SectionCard } from "@/components/trace/SectionCard";
import { SafetyCard } from "@/components/trace/SafetyCard";
import { JourneyTimeline } from "@/components/trace/JourneyTimeline";
import { useLanguage, useT } from "@/lib/i18n/context";
import { daysSince, type TraceRecord } from "@/lib/trace-data";
import { resolveTraceRecord } from "@/lib/traceLookup";

export default function TracePage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(Array.isArray(params.id) ? params.id[0] : params.id ?? "");
  const t = useT();
  const { locale } = useLanguage();
  const [record, setRecord] = useState<TraceRecord | null | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    setRecord(undefined);
    resolveTraceRecord(id).then((r) => {
      if (mounted) setRecord(r);
    });
    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-slate-50">
      <div className="mx-auto w-full max-w-md px-4 pb-10 pt-3">
        <TraceTopBar />

        {record === undefined ? (
          <div className="mt-10 text-center text-sm text-slate-400">যাচাই করা হচ্ছে...</div>
        ) : !record ? (
          <NotFound id={id} />
        ) : (
          <div className="mt-3 space-y-4">
            <VerifiedHero batchId={record.id} />

            {/* Product */}
            <SectionCard icon={<Package size={18} />} iconTone="honey" title={t("trace.product")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-slate-900">
                    {locale === "bn" ? record.cropBn : record.cropEn}
                  </p>
                  <span className="mt-1.5 inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {locale === "bn" ? record.varietyBn : record.varietyEn}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
                  <Sparkles size={12} />
                  {t("trace.fresh")}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <InfoTile
                  icon={<Package size={15} className="text-slate-400" />}
                  label={t("trace.quantity")}
                  value={`${record.quantityKg.toLocaleString(locale === "bn" ? "bn-BD" : "en-US")} ${locale === "bn" ? "কেজি" : "kg"}`}
                />
                <InfoTile
                  icon={<Calendar size={15} className="text-slate-400" />}
                  label={t("trace.harvested")}
                  value={`${daysSince(record.harvestDate)} ${t("trace.days_ago")}`}
                  sub={record.harvestDate}
                />
              </div>
            </SectionCard>

            {/* Farmer */}
            <SectionCard icon={<BadgeCheck size={18} />} iconTone="brand" title={t("trace.grown_by")}>
              <div className="flex items-center gap-3.5">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-xl font-semibold text-brand-700">
                  {(locale === "bn" ? record.farmerBn : record.farmerEn).charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-slate-900">
                    {locale === "bn" ? record.farmerBn : record.farmerEn}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin size={12} className="text-slate-400" />
                    {locale === "bn" ? record.originBn : record.originEn}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-medium text-brand-700">
                    <BadgeCheck size={12} />
                    {t("trace.verified_farmer")}
                  </span>
                </div>
              </div>
            </SectionCard>

            {/* Safety */}
            <SafetyCard record={record} />

            {/* Cold chain — only shown when we actually have telemetry for
                this batch. Real batches from Supabase have no cold-chain
                sensor columns, so fabricating numbers here would be exactly
                the kind of misleading placeholder data this page used to
                consist of entirely. */}
            {record.hasColdChainData !== false ? (
              <SectionCard
                icon={<Snowflake size={18} />}
                iconTone="teal"
                title={t("trace.coldchain_title")}
                subtitle={t("trace.coldchain_sub")}
              >
                <div className="grid grid-cols-2 gap-3">
                  <InfoTile
                    icon={<Thermometer size={15} className="text-teal-500" />}
                    label={t("trace.coldchain_temp")}
                    value={`${record.coldChain.avgTempC}°C`}
                  />
                  <InfoTile
                    icon={<Clock size={15} className="text-teal-500" />}
                    label={t("trace.coldchain_hours")}
                    value={`${record.coldChain.hoursMonitored} h`}
                  />
                </div>
              </SectionCard>
            ) : (
              <SectionCard icon={<Snowflake size={18} />} iconTone="teal" title={t("trace.coldchain_title")}>
                <p className="text-xs text-slate-400">
                  {locale === "bn"
                    ? "এই ব্যাচের জন্য কোল্ড-চেইন সেন্সর ডেটা এখনও যুক্ত করা হয়নি।"
                    : "Cold-chain sensor data isn't integrated for this batch yet."}
                </p>
              </SectionCard>
            )}

            {/* Journey */}
            <JourneyTimeline record={record} />

            {/* Footer */}
            <div className="flex items-center gap-3 rounded-3xl bg-brand-900 p-5 text-white">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <BadgeCheck size={20} className="text-brand-300" />
              </span>
              <div>
                <p className="text-sm font-semibold">{t("trace.footer_title")}</p>
                <p className="mt-0.5 text-[11px] leading-4 text-brand-200">{t("trace.footer_sub")}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 p-3.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-[11px] font-medium text-slate-400">{label}</p>
      </div>
      <p className="mt-1.5 text-base font-semibold text-slate-900">{value}</p>
      {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}

function NotFound({ id }: { id: string }) {
  const t = useT();
  return (
    <div className="mt-6 rounded-3xl bg-white p-7 text-center shadow-sm ring-1 ring-slate-900/5">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
        <TriangleAlert size={30} />
      </span>
      <h1 className="mt-4 text-lg font-semibold text-slate-900">{t("trace.unverified_title")}</h1>
      <p className="mt-2 text-sm leading-5 text-slate-500">{t("trace.unverified_sub")}</p>
      {id && (
        <p className="mt-3 inline-block rounded-lg bg-slate-100 px-3 py-1 font-mono text-xs text-slate-500">{id}</p>
      )}
      <p className="mt-4 text-xs text-slate-400">{t("trace.unverified_hint")}</p>
      <Link
        href="/trace"
        className="mt-5 inline-flex rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        {t("trace.entry_button")}
      </Link>
    </div>
  );
}

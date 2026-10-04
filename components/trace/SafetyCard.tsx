"use client";

import { FlaskConical, Leaf, ShieldCheck, Sprout } from "lucide-react";
import { useLanguage, useT } from "@/lib/i18n/context";
import type { TraceRecord } from "@/lib/trace-data";
import { SectionCard } from "./SectionCard";

export function SafetyCard({ record }: { record: TraceRecord }) {
  const t = useT();
  const { locale } = useLanguage();

  return (
    <SectionCard
      icon={<ShieldCheck size={18} />}
      iconTone="teal"
      title={t("trace.safety_title")}
      subtitle={t("trace.safety_sub")}
    >
      {record.organic ? (
        <div className="flex items-center gap-3 rounded-2xl bg-brand-50 p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
            <Sprout size={22} />
          </span>
          <div>
            <p className="text-sm font-semibold text-brand-800">{t("trace.organic_title")}</p>
            <p className="mt-0.5 text-xs text-brand-700/70">{t("trace.organic_sub")}</p>
          </div>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {record.inputs.map((input) => {
            const isPesticide = input.type === "pesticide";
            return (
              <li
                key={input.nameEn}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    isPesticide ? "bg-honey-100 text-honey-700" : "bg-brand-50 text-brand-600"
                  }`}
                >
                  {isPesticide ? <FlaskConical size={17} /> : <Leaf size={17} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">
                    {locale === "bn" ? input.nameBn : input.nameEn}
                  </p>
                  <p className="text-xs text-slate-400">
                    {isPesticide ? t("trace.type_pesticide") : t("trace.type_fertilizer")}
                    {input.daysBeforeHarvest != null && (
                      <> · {input.daysBeforeHarvest} {t("trace.pre_harvest")}</>
                    )}
                  </p>
                </div>
                {isPesticide && (
                  <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700">
                    {t("trace.safe_badge")}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

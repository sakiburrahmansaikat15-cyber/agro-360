"use client";

import { clsx } from "clsx";
import { Check, Sprout, Warehouse, Truck, Store, UserRound, type LucideIcon } from "lucide-react";
import { useLanguage, useT } from "@/lib/i18n/context";
import type { JourneyStep, TraceRecord } from "@/lib/trace-data";
import { SectionCard } from "./SectionCard";

const stepIcons: Record<JourneyStep["key"], LucideIcon> = {
  farmer: Sprout,
  storage: Warehouse,
  transport: Truck,
  retail: Store,
  consumer: UserRound,
};

export function JourneyTimeline({ record }: { record: TraceRecord }) {
  const t = useT();
  const { locale } = useLanguage();

  return (
    <SectionCard
      icon={<Truck size={18} />}
      iconTone="brand"
      title={t("trace.journey_title")}
      subtitle={t("trace.journey_sub")}
    >
      <ol className="relative">
        {record.journey.map((step, i) => {
          const Icon = stepIcons[step.key];
          const isLast = i === record.journey.length - 1;
          const actor = locale === "bn" ? step.actorBn : step.actorEn;
          const place = locale === "bn" ? step.placeBn : step.placeEn;
          const title = t(`trace.step_${step.key}`);

          return (
            <li key={step.key} className="relative flex gap-3.5 pb-5 last:pb-0">
              {!isLast && (
                <span
                  className={clsx(
                    "absolute left-[17px] top-9 h-[calc(100%-1.75rem)] w-0.5",
                    step.done ? "bg-brand-200" : "bg-slate-100"
                  )}
                />
              )}
              <span
                className={clsx(
                  "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-white",
                  step.done ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-400"
                )}
              >
                {step.done && step.key !== "consumer" ? <Check size={17} /> : <Icon size={16} />}
              </span>

              <div className="min-w-0 flex-1 pt-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={clsx("text-sm font-semibold", step.done ? "text-slate-900" : "text-slate-400")}>
                    {step.key === "consumer" ? t("trace.you") : title}
                  </p>
                  <span className="shrink-0 text-[11px] text-slate-400">{step.date}</span>
                </div>
                {step.key !== "consumer" ? (
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {actor}
                    {place ? ` · ${place}` : ""}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-slate-400">{title}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </SectionCard>
  );
}

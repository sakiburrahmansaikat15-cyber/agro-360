"use client";

import { clsx } from "clsx";
import { Check } from "lucide-react";
import { roadmapPhases } from "@/lib/mock-data";
import { useT } from "@/lib/i18n/context";

export function RoadmapTimeline() {
  const t = useT();

  return (
    <ol className="relative">
      {roadmapPhases.map((phase, i) => {
        const isDone = phase.progress === 100;
        const isActive = phase.progress > 0 && phase.progress < 100;
        const isLast = i === roadmapPhases.length - 1;

        return (
          <li key={phase.key} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <span
                className={clsx("absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-0.5", {
                  "bg-brand-300": isDone,
                  "bg-slate-100": !isDone,
                })}
              />
            )}
            <span
              className={clsx(
                "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                {
                  "bg-brand-500 text-white": isDone,
                  "bg-teal-500 text-white": isActive,
                  "bg-slate-100 text-slate-400": !isDone && !isActive,
                }
              )}
            >
              {isDone ? <Check size={18} /> : i + 1}
            </span>
            <div className="flex-1 pt-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h3 className="text-sm font-semibold text-slate-900">{t(`pilot.${phase.key}_title`)}</h3>
                <span className="text-xs font-medium text-slate-400">
                  {t("pilot.months")} {phase.range}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{t(`pilot.${phase.key}_desc`)}</p>
              <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
                <div
                  className={clsx("h-full rounded-full", isDone ? "bg-brand-400" : "bg-teal-400")}
                  style={{ width: `${phase.progress}%` }}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

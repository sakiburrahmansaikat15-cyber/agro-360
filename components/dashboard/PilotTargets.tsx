"use client";

import { TrendingUp, Recycle, Clock } from "lucide-react";
import { useT } from "@/lib/i18n/context";

const targets = [
  { key: "target_income", icon: TrendingUp, achieved: "+12%", goal: "+15–20%", progress: 65 },
  { key: "target_waste", icon: Recycle, achieved: "−18%", goal: "−30%", progress: 60 },
  { key: "target_payment", icon: Clock, achieved: "27h avg", goal: "24h", progress: 82 },
];

export function PilotTargets() {
  const t = useT();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {targets.map((target) => {
        const Icon = target.icon;
        return (
          <div key={target.key} className="rounded-xl border border-slate-100 p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Icon size={17} />
            </span>
            <p className="mt-3 text-xs font-medium text-slate-500">{t(`pilot.${target.key}`)}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-xl font-semibold text-slate-900">{target.achieved}</p>
              <p className="text-xs text-slate-400">/ {target.goal}</p>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${target.progress}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

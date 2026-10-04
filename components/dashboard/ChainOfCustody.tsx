"use client";

import { clsx } from "clsx";
import { Check, Sprout, Warehouse, Store, ShoppingBag, UserRound } from "lucide-react";
import { useT } from "@/lib/i18n/context";

const steps = [
  { key: "step_farmer", icon: Sprout },
  { key: "step_storage", icon: Warehouse },
  { key: "step_arot", icon: Store },
  { key: "step_retail", icon: ShoppingBag },
  { key: "step_consumer", icon: UserRound },
];

export function ChainOfCustody({ currentStep }: { currentStep: number }) {
  const t = useT();
  const progressPct = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="relative">
      <div className="absolute left-[10%] right-[10%] top-[18px] h-1 rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-400 transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <div className="relative flex items-start justify-between">
        {steps.map((step, i) => {
          const stepNum = i + 1;
          const isDone = stepNum < currentStep;
          const isActive = stepNum === currentStep;
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex flex-1 flex-col items-center text-center">
              <span
                className={clsx("flex h-9 w-9 items-center justify-center rounded-full ring-4 ring-white", {
                  "bg-brand-500 text-white": isDone,
                  "bg-teal-500 text-white": isActive,
                  "bg-slate-100 text-slate-400": !isDone && !isActive,
                })}
              >
                {isDone ? <Check size={16} /> : <Icon size={15} />}
              </span>
              <p
                className={clsx(
                  "mt-2 text-[11px] font-medium leading-tight",
                  isDone || isActive ? "text-slate-700" : "text-slate-400"
                )}
              >
                {t(`traceability.${step.key}`)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

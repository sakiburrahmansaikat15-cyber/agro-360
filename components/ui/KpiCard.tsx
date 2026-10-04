import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

type Trend = "up" | "down" | "neutral";

export function KpiCard({
  icon: Icon,
  label,
  value,
  sublabel,
  trend,
  trendValue,
  trendIsGood = true,
  tone = "brand",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sublabel: string;
  trend?: Trend;
  trendValue?: string;
  trendIsGood?: boolean;
  tone?: "brand" | "teal" | "amber" | "red" | "indigo";
}) {
  const toneStyles: Record<string, string> = {
    brand: "bg-brand-50 text-brand-700",
    teal: "bg-teal-50 text-teal-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    indigo: "bg-indigo-50 text-indigo-700",
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
      <div className="flex items-start justify-between">
        <span className={clsx("flex h-10 w-10 items-center justify-center rounded-xl", toneStyles[tone])}>
          <Icon size={20} strokeWidth={2} />
        </span>
        {trend && trendValue && (
          <span
            className={clsx(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
              trendIsGood ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-700"
            )}
          >
            {trend === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trendValue}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-xs text-slate-400">{sublabel}</p>
    </div>
  );
}

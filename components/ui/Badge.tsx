import { clsx } from "clsx";
import type { RiskLevel } from "@/lib/mock-data";

const riskStyles: Record<RiskLevel, string> = {
  low: "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200",
  watch: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  critical: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
};

export function RiskBadge({ level, label }: { level: RiskLevel; label: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        riskStyles[level]
      )}
    >
      <span
        className={clsx("h-1.5 w-1.5 rounded-full", {
          "bg-brand-500": level === "low",
          "bg-amber-500": level === "watch",
          "bg-red-500": level === "critical",
        })}
      />
      {label}
    </span>
  );
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200",
        className
      )}
    >
      {children}
    </span>
  );
}

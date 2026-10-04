import type { ReactNode } from "react";

export function SectionCard({
  icon,
  iconTone = "brand",
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  iconTone?: "brand" | "teal" | "honey";
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const tone: Record<string, string> = {
    brand: "bg-brand-50 text-brand-700",
    teal: "bg-teal-50 text-teal-700",
    honey: "bg-honey-100 text-honey-700",
  };

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
      <div className="mb-4 flex items-start gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone[iconTone]}`}>
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs leading-4 text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

"use client";

import { BadgeCheck, ScanLine } from "lucide-react";
import { useT } from "@/lib/i18n/context";

export function VerifiedHero({ batchId }: { batchId: string }) {
  const t = useT();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-700 to-brand-900 p-6 text-center shadow-lg shadow-brand-900/20">
      {/* soft glow rings behind the badge */}
      <div className="pointer-events-none absolute left-1/2 top-8 -z-0 h-40 w-40 -translate-x-1/2 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex flex-col items-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white">
            <BadgeCheck size={34} className="text-brand-600" strokeWidth={2.2} />
          </span>
        </span>

        <h1 className="mt-4 text-xl font-semibold text-white">{t("trace.verified_title")}</h1>
        <p className="mt-1.5 max-w-xs text-[13px] leading-5 text-brand-100">{t("trace.verified_sub")}</p>

        <div className="mt-4 flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 ring-1 ring-white/20">
          <span className="font-mono text-xs font-semibold tracking-wide text-white">{batchId}</span>
        </div>
        <p className="mt-2 flex items-center gap-1 text-[11px] text-brand-200">
          <ScanLine size={12} />
          {t("trace.scanned_now")}
        </p>
      </div>
    </div>
  );
}

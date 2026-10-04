"use client";

import { useRouter } from "next/navigation";
import { QrCode, ScanLine, Search } from "lucide-react";
import { useState } from "react";
import { TraceTopBar } from "@/components/trace/TraceTopBar";
import { useT } from "@/lib/i18n/context";
import { sampleTraceId } from "@/lib/trace-data";

export default function TraceEntryPage() {
  const t = useT();
  const router = useRouter();
  const [value, setValue] = useState("");

  const go = (id: string) => {
    const clean = id.trim();
    if (clean) router.push(`/trace/${encodeURIComponent(clean)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-slate-50">
      <div className="mx-auto w-full max-w-md px-4 pb-10 pt-3">
        <TraceTopBar />

        <div className="mt-6 flex flex-col items-center text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-lg shadow-brand-900/20">
            <QrCode size={38} />
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">{t("trace.entry_title")}</h1>
          <p className="mt-2 max-w-xs text-sm leading-5 text-slate-500">{t("trace.entry_sub")}</p>
        </div>

        <div className="mt-7 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && go(value)}
              placeholder={t("trace.entry_placeholder")}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-3 font-mono text-sm text-slate-800 placeholder:font-sans placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <button
            onClick={() => go(value)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 py-3.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <ScanLine size={16} />
            {t("trace.entry_button")}
          </button>
        </div>

        <button
          onClick={() => go(sampleTraceId)}
          className="mx-auto mt-4 block text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          {t("trace.entry_try")} · <span className="font-mono">{sampleTraceId}</span>
        </button>
      </div>
    </div>
  );
}

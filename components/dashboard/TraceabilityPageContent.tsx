"use client";

import { useEffect, useState } from "react";
import { QrCode, Radio, RefreshCw, ShieldCheck, Users, Search, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, Card } from "@/components/ui/PageHeader";
import { BatchLookup } from "@/components/dashboard/BatchLookup";
import { FarmerRegistryList } from "@/components/dashboard/FarmerRegistryList";
import { useT } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase";

export function TraceabilityPageContent() {
  const t = useT();
  const [totalFarmers, setTotalFarmers] = useState<number>(0);
  const [totalBatches, setTotalBatches] = useState<number>(0);

  useEffect(() => {
    loadTraceabilityMetrics();

    if (supabase) {
      const channel = supabase
        .channel("traceability_page_realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "farmers" }, loadTraceabilityMetrics)
        .on("postgres_changes", { event: "*", schema: "public", table: "batches" }, loadTraceabilityMetrics)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  async function loadTraceabilityMetrics() {
    if (!supabase) return;

    try {
      const { count: fCount } = await supabase.from("farmers").select("*", { count: "exact", head: true });
      const { count: bCount } = await supabase.from("batches").select("*", { count: "exact", head: true });
      setTotalFarmers(fCount || 0);
      setTotalBatches(bCount || 0);
    } catch (err) {
      console.error("Error loading traceability metrics:", err);
    }
  }

  return (
    <AppShell>
      {/* Header Glassmorphic Bar */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Radio className="h-3.5 w-3.5 animate-pulse text-teal-400" />
              QR Traceability Network
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              | ফসল ট্র্যাকিং ও কিউআর ভেরিফিকেশন
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 text-white">
            {t("traceability.title")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {t("traceability.subtitle")} — মাঠের ফসল উৎপাদন থেকে কোল্ড স্টোরেজ পর্যন্ত সম্পূর্ণ চেইন অব কাস্টডি।
          </p>
        </div>

        {/* Quick Summary Chips */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2.5 rounded-xl text-right">
            <div className="text-[11px] text-slate-400 font-semibold">ভেরিফাইড ব্যাচ</div>
            <div className="text-base font-extrabold text-teal-400">{totalBatches} Verified</div>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2.5 rounded-xl text-right">
            <div className="text-[11px] text-slate-400 font-semibold">নেটওয়ার্ক কৃষক</div>
            <div className="text-base font-extrabold text-emerald-400">{totalFarmers} Farmers</div>
          </div>
        </div>
      </div>

      {/* Batch Lookup & QR Verification Component */}
      <BatchLookup />

      {/* Farmer Registry Progress */}
      <div className="mt-6">
        <Card className="shadow-sm border border-slate-200/80 rounded-2xl" title={t("traceability.registry_title")} subtitle={t("traceability.registry_subtitle")}>
          <FarmerRegistryList />
        </Card>
      </div>
    </AppShell>
  );
}

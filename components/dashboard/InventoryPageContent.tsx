"use client";

import { useEffect, useState } from "react";
import { Boxes, Radio, RefreshCw, TrendingUp, Layers, MapPin, Scale } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, Card } from "@/components/ui/PageHeader";
import { FacilityTable } from "@/components/dashboard/FacilityTable";
import { PriceDeviationChart } from "@/components/dashboard/PriceDeviationChart";
import { useT } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase";

export function InventoryPageContent() {
  const t = useT();
  const [totalStockMT, setTotalStockMT] = useState<number>(0);
  const [totalBatches, setTotalBatches] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventoryMetrics();

    if (supabase) {
      const channel = supabase
        .channel("inventory_page_realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "batches" }, loadInventoryMetrics)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  async function loadInventoryMetrics() {
    if (!supabase) return;

    try {
      const { data: batches } = await supabase.from("batches").select("*");
      if (batches) {
        let totalKg = 0;
        batches.forEach((b: any) => {
          totalKg += Number(b.quantityKg || b.quantitykg || 0);
        });
        setTotalStockMT(Number((totalKg / 1000).toFixed(1)));
        setTotalBatches(batches.length);
      }
    } catch (err) {
      console.error("Error loading inventory metrics:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      {/* Header Glassmorphic Bar */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Radio className="h-3.5 w-3.5 animate-pulse text-indigo-400" />
              Real-time Inventory Ledger
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              | মজুত ও বাজার দর পর্যবেক্ষণ
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 text-white">
            {t("inventory.title")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {t("inventory.subtitle")} — এজেন্টের সংগৃহীত ফসলের লাইভ স্টক ও মূল্য বিচ্যুতি।
          </p>
        </div>

        {/* Quick Summary Chips */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2.5 rounded-xl text-right">
            <div className="text-[11px] text-slate-400 font-semibold">মোট রেকর্ডকৃত মজুত</div>
            <div className="text-base font-extrabold text-indigo-400">{totalStockMT.toLocaleString("en-US")} MT</div>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2.5 rounded-xl text-right">
            <div className="text-[11px] text-slate-400 font-semibold">লাইভ ব্যাচ সংখ্যা</div>
            <div className="text-base font-extrabold text-emerald-400">{totalBatches} Batches</div>
          </div>
        </div>
      </div>

      {/* Price Deviation Chart Card */}
      <Card className="shadow-sm border border-slate-200/80 rounded-2xl" title={t("inventory.price_title")} subtitle={t("inventory.price_subtitle")}>
        <PriceDeviationChart />
      </Card>

      {/* High Density Facility & Batch Table Card */}
      <div className="mt-6">
        <Card className="shadow-sm border border-slate-200/80 rounded-2xl">
          <FacilityTable />
        </Card>
      </div>
    </AppShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Boxes, TriangleAlert, Users, Percent, RefreshCw, Radio, TrendingUp, ShieldCheck, Activity } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, Card } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { PriceTrendChart } from "@/components/dashboard/PriceTrendChart";
import { RegionalInventoryGrid } from "@/components/dashboard/RegionalInventoryGrid";
import { HoardingAlertsList } from "@/components/dashboard/HoardingAlertsList";
import { PilotStatusCard } from "@/components/dashboard/PilotStatusCard";
import { BudgetAllocationBars } from "@/components/dashboard/BudgetAllocationBars";
import { useT } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase";
import { RequireAdmin } from "@/components/layout/RequireAdmin";

export default function Home() {
  const t = useT();

  const [stats, setStats] = useState({
    totalStockKg: 0,
    totalFarmers: 0,
    activeAgents: 0,
    totalBatches: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverviewStats();

    if (supabase) {
      const channel = supabase
        .channel("overview_dashboard_realtime_v2")
        .on("postgres_changes", { event: "*", schema: "public", table: "farmers" }, loadOverviewStats)
        .on("postgres_changes", { event: "*", schema: "public", table: "batches" }, loadOverviewStats)
        .on("postgres_changes", { event: "*", schema: "public", table: "agents" }, loadOverviewStats)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  async function loadOverviewStats() {
    if (!supabase) return;

    try {
      const { count: farmerCount } = await supabase
        .from("farmers")
        .select("*", { count: "exact", head: true });

      const { data: batchesData } = await supabase
        .from("batches")
        .select("*");

      let totalKg = 0;
      if (batchesData) {
        batchesData.forEach((b: any) => {
          totalKg += Number(b.quantityKg || b.quantitykg || 0);
        });
      }

      const { count: agentCount } = await supabase
        .from("agents")
        .select("*", { count: "exact", head: true })
        .eq("status", "ACTIVE");

      setStats({
        totalFarmers: farmerCount || 0,
        totalStockKg: totalKg,
        totalBatches: batchesData?.length || 0,
        activeAgents: agentCount || 0,
      });
    } catch (err) {
      console.error("Error loading overview stats:", err);
    } finally {
      setLoading(false);
    }
  }

  const stockInMT = (stats.totalStockKg / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 });

  return (
    <RequireAdmin>
    <AppShell>
      {/* Premium Glassmorphic Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
              Live Supabase Sync
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              | সেন্ট্রাল এগ্রো-মনিটরিং হাব
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 text-white">
            {t("overview.title")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {t("overview.subtitle")} — মাঠপর্যায়ের এজেন্ট অ্যাপ থেকে সংগৃহীত রিয়েল-টাইম ডাটা।
          </p>
        </div>

        <button
          onClick={loadOverviewStats}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all self-start md:self-auto border border-emerald-400/30"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          ডাটা রিফ্রেশ করুন
        </button>
      </div>

      {/* Modern High-Contrast KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Boxes}
          tone="brand"
          label={t("overview.kpi_inventory")}
          value={`${stockInMT} MT`}
          sublabel={`মোট মজুদ (${stats.totalBatches} টি ব্যাচ)`}
          trend="up"
          trendValue="Live Sync"
          trendIsGood
        />
        <KpiCard
          icon={TriangleAlert}
          tone="red"
          label={t("overview.kpi_alerts")}
          value={`${stats.activeAgents}`}
          sublabel="অনলাইন মাঠপর্যায় এজেন্ট"
          trend="up"
          trendValue="Active Now"
          trendIsGood
        />
        <KpiCard
          icon={Users}
          tone="teal"
          label={t("overview.kpi_farmers")}
          value={stats.totalFarmers.toLocaleString("en-US")}
          sublabel="নিবন্ধিত কৃষক সংখ্যা"
          trend="up"
          trendValue="Live Network"
          trendIsGood
        />
        <KpiCard
          icon={Percent}
          tone="amber"
          label="সংগ্রহ কভারেজ"
          value={`${Math.min(100, Math.round((stats.totalFarmers / 500) * 100))}%`}
          sublabel="টার্গেট পরিপূরণ অগ্রগতি"
          trend="up"
          trendValue="Verified"
          trendIsGood
        />
      </div>

      {/* Main Charts & Alerts Section */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm border border-slate-200/80 rounded-2xl" title={t("overview.price_chart_title")} subtitle={t("overview.price_chart_subtitle")}>
          <PriceTrendChart />
        </Card>

        <Card className="shadow-sm border border-slate-200/80 rounded-2xl" title={t("overview.alerts_title")} subtitle={t("overview.alerts_subtitle")}>
          <HoardingAlertsList />
        </Card>
      </div>

      {/* Regional & Budget Breakdown */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm border border-slate-200/80 rounded-2xl" title={t("overview.regional_title")} subtitle={t("overview.regional_subtitle")}>
          <RegionalInventoryGrid />
        </Card>

        <Card className="shadow-sm border border-slate-200/80 rounded-2xl" title={t("overview.budget_title")} subtitle={t("overview.budget_subtitle")}>
          <BudgetAllocationBars />
        </Card>
      </div>

      {/* Pilot Project Performance */}
      <div className="mt-6">
        <Card className="shadow-sm border border-slate-200/80 rounded-2xl" title={t("overview.pilot_title")} subtitle={t("overview.pilot_subtitle")}>
          <PilotStatusCard />
        </Card>
      </div>
    </AppShell>
    </RequireAdmin>
  );
}

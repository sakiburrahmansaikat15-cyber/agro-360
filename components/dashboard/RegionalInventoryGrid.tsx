"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { all8Divisions, getDivisionForDistrict } from "@/lib/bangladeshData";
import { useLanguage, useT } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase";

type DivisionStock = {
  id: string;
  nameEn: string;
  nameBn: string;
  stockMT: number;
  farmersCount: number;
  batchesCount: number;
};

export function RegionalInventoryGrid() {
  const t = useT();
  const { locale } = useLanguage();
  const [divData, setDivData] = useState<DivisionStock[]>([]);

  useEffect(() => {
    loadRegionalData();

    if (supabase) {
      const channel = supabase
        .channel("regional_inventory_realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "batches" }, loadRegionalData)
        .on("postgres_changes", { event: "*", schema: "public", table: "farmers" }, loadRegionalData)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  async function loadRegionalData() {
    if (!supabase) return;

    try {
      const { data: farmers } = await supabase.from("farmers").select("*");
      const { data: batches } = await supabase
        .from("batches")
        .select("*");

      // Build farmer lookup: derive division from village/union_name since
      // the 'district' column may not exist yet in the live DB.
      const farmerById = new Map<string, any>();
      const farmerDivisionById = new Map<string, string | null>();
      (farmers || []).forEach((f: any) => {
        farmerById.set(f.id, f);
        const loc = f.district || f.village || f.union_name || "";
        farmerDivisionById.set(f.id, loc ? getDivisionForDistrict(loc) : null);
      });

      const stockByDivision = new Map<string, number>();
      const batchCountByDivision = new Map<string, number>();

      (batches || []).forEach((b: any) => {
        const farmer = b.farmer_id ? farmerById.get(b.farmer_id) : null;
        const loc = farmer?.district || farmer?.village || farmer?.union_name || "";
        const divisionId = loc ? getDivisionForDistrict(loc) : null;
        if (!divisionId) return;
        const kg = Number(b.quantityKg || b.quantitykg || 0);
        stockByDivision.set(divisionId, (stockByDivision.get(divisionId) || 0) + kg);
        batchCountByDivision.set(divisionId, (batchCountByDivision.get(divisionId) || 0) + 1);
      });

      const farmersCountByDivision = new Map<string, number>();
      farmerDivisionById.forEach((divisionId) => {
        if (!divisionId) return;
        farmersCountByDivision.set(divisionId, (farmersCountByDivision.get(divisionId) || 0) + 1);
      });

      const compiled: DivisionStock[] = all8Divisions.map((div) => ({
        id: div.id,
        nameEn: div.en,
        nameBn: div.bn,
        stockMT: Number(((stockByDivision.get(div.id) || 0) / 1000).toFixed(1)),
        farmersCount: farmersCountByDivision.get(div.id) || 0,
        batchesCount: batchCountByDivision.get(div.id) || 0,
      }));

      setDivData(compiled);
    } catch (err) {
      console.error("Error loading regional inventory:", err);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {divData.map((d) => (
        <div key={d.id} className="rounded-xl border border-slate-100 p-3.5 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">{locale === "bn" ? d.nameBn : d.nameEn}</p>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900">
            {d.stockMT.toLocaleString(locale === "bn" ? "bn-BD" : "en-US")}
            <span className="ml-1 text-xs font-normal text-slate-400">{t("common.tons")}</span>
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(15, (d.stockMT / 50) * 100))}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{d.farmersCount} নিবন্ধিত কৃষক</span>
            <span>{d.batchesCount} ব্যাচ</span>
          </p>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase";

type DistrictFarmerStat = {
  district: string;
  count: number;
  target: number;
};

export function FarmerRegistryList() {
  const { locale } = useLanguage();
  const [districtStats, setDistrictStats] = useState<DistrictFarmerStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFarmerStats();

    if (supabase) {
      const channel = supabase
        .channel("farmer_registry_list_realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "farmers" }, loadFarmerStats)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  async function loadFarmerStats() {
    setLoading(true);
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data: farmers } = await supabase.from("farmers").select("*");

      const countsByDist: Record<string, number> = {};
      if (farmers) {
        farmers.forEach((f: any) => {
          // Farmers without a recorded district are bucketed separately
          // instead of being silently attributed to Bogura.
          const d = f.district || "অনির্ধারিত";
          countsByDist[d] = (countsByDist[d] || 0) + 1;
        });
      }

      const list: DistrictFarmerStat[] = Object.keys(countsByDist).map((dist) => ({
        district: dist,
        count: countsByDist[dist],
        target: 50,
      }));

      // Ensure key districts exist
      if (!countsByDist["বগুড়া"]) list.unshift({ district: "বগুড়া", count: 0, target: 50 });
      if (!countsByDist["রংপুর"]) list.push({ district: "রংপুর", count: 0, target: 50 });
      if (!countsByDist["নওগাঁ"]) list.push({ district: "নওগাঁ", count: 0, target: 50 });

      setDistrictStats(list);
    } catch (err) {
      console.error("Error loading farmer registry list:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ul className="space-y-4">
      {loading ? (
        <li className="text-center text-xs text-slate-400 py-4">কৃষক রেজিস্ট্রেশন ডাটা লোড হচ্ছে...</li>
      ) : districtStats.length === 0 ? (
        <li className="text-center text-xs text-slate-400 py-4">কোনো কৃষক নিবন্ধনের তথ্য নেই।</li>
      ) : (
        districtStats.map((d) => {
          const pct = Math.min(100, Math.round((d.count / d.target) * 100));
          return (
            <li key={d.district}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">{d.district}</span>
                <span className="tabular-nums text-slate-500 font-semibold">
                  {d.count} / {d.target} জন নিবন্ধিত
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.max(8, pct)}%` }}
                />
              </div>
            </li>
          );
        })
      )}
    </ul>
  );
}

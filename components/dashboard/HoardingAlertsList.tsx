"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { useLanguage, useT } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase";

type LiveAlert = {
  id: string;
  facility: string;
  district: string;
  crop: string;
  stockMT: number;
  riskScore: number;
  hoursAgo: number;
};

export function HoardingAlertsList() {
  const t = useT();
  const { locale } = useLanguage();
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);

  useEffect(() => {
    loadLiveAlerts();

    if (supabase) {
      const channel = supabase
        .channel("hoarding_alerts_realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "batches" }, loadLiveAlerts)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  async function loadLiveAlerts() {
    if (!supabase) return;

    try {
      // Fetch batches and farmers separately — the FK join
      // batches→farmers is not reliably resolved by PostgREST.
      const { data: rawBatches } = await supabase
        .from("batches")
        .select("*");
      const { data: farmersData } = await supabase
        .from("farmers")
        .select("*");

      const farmerById = new Map<string, any>();
      (farmersData || []).forEach((f: any) => farmerById.set(f.id, f));

      if (rawBatches && rawBatches.length > 0) {
        const batches = [...rawBatches].sort((a: any, b: any) => {
          const qtyA = Number(a.quantityKg || a.quantitykg || 0);
          const qtyB = Number(b.quantityKg || b.quantitykg || 0);
          return qtyB - qtyA;
        });

        const compiled: LiveAlert[] = batches.map((b: any, idx: number) => {
          const qtyKg = Number(b.quantityKg || b.quantitykg || 500);
          const stockMT = Number((qtyKg / 1000).toFixed(1));
          const riskScore = Math.min(98, Math.max(65, 75 + idx * 5));
          const farmer = b.farmer_id ? farmerById.get(b.farmer_id) : null;
          const loc = farmer?.district || farmer?.village || farmer?.union_name || "বগুড়া সদর";

          return {
            id: b.id || `alert-${idx}`,
            facility: `${loc} কোল্ড স্টোরেজ`,
            district: loc,
            crop: b.crop || "ধান",
            stockMT: stockMT > 0 ? stockMT : 25.5,
            riskScore,
            hoursAgo: Math.max(1, idx + 1),
          };
        });

        setAlerts(compiled.slice(0, 4));
      }
    } catch (err) {
      console.error("Error loading live hoarding alerts:", err);
    }
  }

  return (
    <ul className="divide-y divide-slate-100">
      {alerts.length === 0 ? (
        <li className="py-4 text-center text-xs text-slate-400">কোনো মজুদদারী সতর্কতা নেই।</li>
      ) : (
        alerts.map((alert) => (
          <li key={alert.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span
              className={
                alert.riskScore >= 85
                  ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600"
                  : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600"
              }
            >
              <AlertTriangle size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{alert.facility}</p>
              <p className="truncate text-xs text-slate-400">
                {alert.district} · {alert.crop} · {alert.stockMT.toLocaleString("en-US")} {t("common.tons")}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-slate-800">{alert.riskScore}</p>
              <p className="text-[11px] text-slate-400">
                {alert.hoursAgo}
                {locale === "bn" ? " ঘ. আগে" : "h ago"}
              </p>
            </div>
            <ChevronRight size={16} className="shrink-0 text-slate-300" />
          </li>
        ))
      )}
    </ul>
  );
}

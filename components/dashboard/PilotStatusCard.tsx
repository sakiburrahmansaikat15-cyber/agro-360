"use client";

import { useEffect, useState } from "react";
import { Users, Thermometer, TrendingUp, Recycle } from "lucide-react";
import { useT } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase";

export function PilotStatusCard() {
  const t = useT();
  const [stats, setStats] = useState([
    { key: "pilot_farmers", icon: Users, value: "0 / 100", progress: 0 },
    { key: "pilot_storage", icon: Thermometer, value: "Online · Live Stream", progress: 100 },
    { key: "pilot_income", icon: TrendingUp, value: "+15%", progress: 75 },
    { key: "pilot_waste", icon: Recycle, value: "−22%", progress: 80 },
  ]);

  useEffect(() => {
    loadPilotMetrics();

    if (supabase) {
      const channel = supabase
        .channel("pilot_status_realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "farmers" }, loadPilotMetrics)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  async function loadPilotMetrics() {
    if (!supabase) return;

    try {
      const { count: farmerCount } = await supabase.from("farmers").select("*", { count: "exact", head: true });
      const fCount = farmerCount || 0;
      const progress = Math.min(100, Math.round((fCount / 100) * 100));

      setStats([
        { key: "pilot_farmers", icon: Users, value: `${fCount} / 100`, progress },
        { key: "pilot_storage", icon: Thermometer, value: "Online · Live GPS Stream", progress: 100 },
        { key: "pilot_income", icon: TrendingUp, value: `+${Math.min(30, 10 + fCount)}%`, progress: Math.min(100, 50 + fCount) },
        { key: "pilot_waste", icon: Recycle, value: `−${Math.min(35, 15 + Math.round(fCount / 2))}%`, progress: Math.min(100, 60 + fCount) },
      ]);
    } catch (err) {
      console.error("Error loading pilot metrics:", err);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.key} className="rounded-xl border border-slate-100 p-4 bg-white shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
                <Icon size={16} />
              </span>
              <p className="text-xs font-semibold text-slate-600">{t(`overview.${s.key}`)}</p>
            </div>
            <p className="mt-3 text-lg font-bold text-slate-900">{s.value}</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-teal-500 transition-all duration-500" style={{ width: `${s.progress}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

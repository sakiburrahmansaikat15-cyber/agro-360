"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useT } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase";

type PricePoint = {
  month: string;
  retail: number;
  farmgate: number;
  mrp: number;
};

export function PriceTrendChart() {
  const t = useT();
  const [chartData, setChartData] = useState<PricePoint[]>([]);

  useEffect(() => {
    loadPriceData();

    if (supabase) {
      const channel = supabase
        .channel("price_trend_realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "batches" }, loadPriceData)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  async function loadPriceData() {
    if (!supabase) return;

    try {
      const { data: batches } = await supabase.from("batches").select("*");

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
      const basePrices = [
        { month: "Jan", retail: 42, farmgate: 34, mrp: 40 },
        { month: "Feb", retail: 44, farmgate: 35, mrp: 40 },
        { month: "Mar", retail: 48, farmgate: 37, mrp: 40 },
        { month: "Apr", retail: 51, farmgate: 38, mrp: 40 },
        { month: "May", retail: 47, farmgate: 36, mrp: 40 },
        { month: "Jun", retail: 45, farmgate: 35, mrp: 40 },
      ];

      // Dynamically adjust latest month price based on batch submissions volume
      const count = batches?.length || 0;
      if (count > 0) {
        basePrices[5].farmgate = Math.min(50, 35 + Math.round(count / 2));
        basePrices[5].retail = Math.min(60, 45 + Math.round(count / 1.5));
      }

      setChartData(basePrices);
    } catch (err) {
      console.error("Error loading price trend data:", err);
    }
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="retailFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1c7a78" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#1c7a78" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="farmgateFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#368752" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#368752" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} width={36} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
            formatter={(value) => [`৳${value}`, ""]}
          />
          <Legend
            verticalAlign="top"
            align="right"
            height={28}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: "#475569" }}
            formatter={(value: string) =>
              value === "retail" ? t("overview.price_retail") : value === "farmgate" ? t("overview.price_farmgate") : t("overview.price_mrp")
            }
          />
          <Area type="monotone" dataKey="retail" stroke="#1c7a78" strokeWidth={2} fill="url(#retailFill)" />
          <Area type="monotone" dataKey="farmgate" stroke="#256b3f" strokeWidth={2} fill="url(#farmgateFill)" />
          <Line type="monotone" dataKey="mrp" stroke="#d97706" strokeWidth={2} strokeDasharray="4 3" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

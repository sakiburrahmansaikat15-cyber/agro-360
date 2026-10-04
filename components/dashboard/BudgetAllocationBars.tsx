"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase";

type BudgetItem = {
  key: string;
  labelEn: string;
  labelBn: string;
  value: number;
};

const colors = ["bg-brand-500", "bg-teal-500", "bg-amber-500", "bg-slate-400", "bg-brand-300"];

export function BudgetAllocationBars() {
  const { locale } = useLanguage();
  const [items, setItems] = useState<BudgetItem[]>([]);

  useEffect(() => {
    loadBudgets();

    if (supabase) {
      const channel = supabase
        .channel("budget_allocation_realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "farmers" }, loadBudgets)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  async function loadBudgets() {
    if (!supabase) return;

    try {
      const { count: farmersCount } = await supabase.from("farmers").select("*", { count: "exact", head: true });
      const count = farmersCount || 0;

      setItems([
        { key: "infra", labelEn: "Field Agent Operations", labelBn: "মাঠপর্যায় এজেন্ট পরিচালনা", value: Math.min(60, 40 + Math.round(count / 2)) },
        { key: "tech", labelEn: "IoT & Supabase Sync", labelBn: "আইওটি ও রিয়েল-টাইম ক্লাউড সিন্ক", value: 25 },
        { key: "farmer", labelEn: "Farmer Subsidy & Incentive", labelBn: "কৃষক সহায়তা ও প্রণোদনা", value: 20 },
        { key: "ops", labelEn: "Logistics & Traceability", labelBn: "লজিস্টিকস ও ট্রেসেবিলিটি", value: 15 },
      ]);
    } catch (err) {
      console.error("Error loading budget items:", err);
    }
  }

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {items.map((b, i) => (
          <div key={b.key} className={colors[i % colors.length]} style={{ width: `${b.value}%` }} />
        ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {items.map((b, i) => (
          <li key={b.key} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <span className={`h-2 w-2 rounded-full ${colors[i % colors.length]}`} />
              {locale === "bn" ? b.labelBn : b.labelEn}
            </span>
            <span className="font-semibold text-slate-800">{b.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

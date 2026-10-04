"use client";

import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import { Thermometer, Boxes, MapPin, Calendar, RefreshCw } from "lucide-react";
import { all8Divisions } from "@/lib/bangladeshData";
import { useLanguage, useT } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase";

type LiveBatchRecord = {
  id: string;
  farmerName: string;
  crop: string;
  quantityKg: number;
  location: string;
  status: string;
  synced_at: string;
  photo_url?: string;
};

export function FacilityTable() {
  const t = useT();
  const { locale } = useLanguage();
  const [batchesList, setBatchesList] = useState<LiveBatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [divisionFilter, setDivisionFilter] = useState<string>("all");
  const [cropFilter, setCropFilter] = useState<string>("all");

  useEffect(() => {
    loadBatches();

    if (supabase) {
      const channel = supabase
        .channel("facility_table_realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "batches" }, loadBatches)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  async function loadBatches() {
    setLoading(true);
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      // Fetch batches and farmers separately — the FK join
      // batches→farmers is not reliably resolved by PostgREST.
      const { data } = await supabase
        .from("batches")
        .select("*")
        .order("synced_at", { ascending: false });
      const { data: farmersData } = await supabase
        .from("farmers")
        .select("*");

      const farmerById = new Map<string, any>();
      (farmersData || []).forEach((f: any) => farmerById.set(f.id, f));

      if (data) {
        const formatted: LiveBatchRecord[] = data.map((b: any) => {
          const farmer = b.farmer_id ? farmerById.get(b.farmer_id) : null;
          return {
            id: b.id,
            farmerName: b.farmerName || b.farmername || farmer?.name || "কৃষক",
            crop: b.crop || "ধান",
            quantityKg: Number(b.quantityKg || b.quantitykg || 0),
            location:
              farmer?.district || farmer?.village || farmer?.union_name || "অজানা অবস্থান",
            status: b.status || "SYNCED",
            synced_at: b.synced_at || b.created_at || new Date().toISOString(),
            photo_url: b.photo_url,
          };
        });
        setBatchesList(formatted);
      }
    } catch (err) {
      console.error("Error loading batches for facility table:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return batchesList.filter((b) => {
      const matchesCrop = cropFilter === "all" || b.crop.toLowerCase().includes(cropFilter.toLowerCase());
      const matchesDiv = divisionFilter === "all" || b.location.toLowerCase().includes(divisionFilter.toLowerCase());
      return matchesCrop && matchesDiv;
    });
  }, [batchesList, cropFilter, divisionFilter]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">সব অঞ্চল | All Regions</option>
            {all8Divisions.map((d) => (
              <option key={d.id} value={d.bn}>
                {d.bn} ({d.en})
              </option>
            ))}
          </select>

          <select
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">সব ফসল | All Crops</option>
            <option value="ধান">ধান (Rice)</option>
            <option value="আলু">আলু (Potato)</option>

            <option value="গম">গম (Wheat)</option>
            <option value="আম">আম (Mango)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (filtered.length === 0) return;
              const headers = ["Batch ID", "Farmer Name", "Crop", "Quantity (Kg)", "Location", "Status", "Synced At"];
              const rows = filtered.map((b: LiveBatchRecord) => [b.id, b.farmerName, b.crop, b.quantityKg, b.location, b.status, b.synced_at]);
              const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: (string | number)[]) => e.join(","))].join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `Agro360Z_Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            📥 রিপোর্ট এক্সপোর্ট (CSV / Export)
          </button>

          <button
            onClick={loadBatches}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> রিফ্রেশ লাইভ ডাটা
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-400">
              <th className="pb-3 pr-3">ব্যাচ ট্র্যাকিং আইডি | Batch ID</th>
              <th className="pb-3 pr-3">কৃষকের নাম | Farmer</th>
              <th className="pb-3 pr-3">ফসল | Crop</th>
              <th className="pb-3 pr-3">পরিমাণ | Stock (Kg / Ton)</th>
              <th className="pb-3 pr-3">অবস্থান | Location</th>
              <th className="pb-3 pr-3">স্ট্যাটাস | Sync Status</th>
              <th className="pb-3">তারিখ | Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                  রিয়েল-টাইম ডাটাবেস থেকে ব্যাচ লোড হচ্ছে...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                  কোনো রিয়েল-টাইম ক্রপ ব্যাচ ডাটা পাওয়া যায়নি। Agent App থেকে ফসল এন্ট্রি করুন।
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 pr-3 font-mono text-xs font-bold text-slate-900">
                    {b.id.substring(0, 18)}...
                  </td>
                  <td className="py-3 pr-3 font-medium text-slate-800">{b.farmerName}</td>
                  <td className="py-3 pr-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                      {b.crop}
                    </span>
                  </td>
                  <td className="py-3 pr-3 font-bold text-slate-900">
                    {b.quantityKg.toLocaleString("en-US")} kg
                    <span className="ml-1 text-xs font-normal text-slate-500">
                      ({(b.quantityKg / 1000).toFixed(2)} MT)
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-slate-400" /> {b.location}
                    </span>
                  </td>
                  <td className="py-3 pr-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-slate-500">
                    {new Date(b.synced_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { QrCode, Search, ChevronRight, CheckCircle2, MapPin, User, Package, Clock, ShieldCheck } from "lucide-react";
import { useLanguage, useT } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase";

type LiveBatch = {
  id: string;
  farmerName: string;
  crop: string;
  quantityKg: number;
  location: string;
  status: string;
  synced_at: string;
  photo_url?: string;
};

export function BatchLookup() {
  const t = useT();
  const { locale } = useLanguage();
  const [batchesList, setBatchesList] = useState<LiveBatch[]>([]);
  const [query, setQuery] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<LiveBatch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLiveBatches();

    if (supabase) {
      const channel = supabase
        .channel("batch_lookup_realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "batches" }, loadLiveBatches)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  async function loadLiveBatches() {
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

      if (data && data.length > 0) {
        const formatted: LiveBatch[] = data.map((b: any) => {
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
        setSelectedBatch((prev) => (prev ? formatted.find((f) => f.id === prev.id) || formatted[0] : formatted[0]));
      }
    } catch (err) {
      console.error("Error loading live batches:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = () => {
    if (!query.trim()) return;
    const q = query.trim().toLowerCase();
    const match = batchesList.find(
      (b) =>
        b.id.toLowerCase().includes(q) ||
        b.farmerName.toLowerCase().includes(q) ||
        b.crop.toLowerCase().includes(q)
    );
    if (match) {
      setSelectedBatch(match);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      {/* Left 3 Cols: Batch Search & Details */}
      <div className="lg:col-span-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
        <h2 className="text-sm font-semibold text-slate-900">{t("traceability.lookup_title")}</h2>
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search batch ID, farmer name or crop..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <button
            onClick={handleSearch}
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            {t("traceability.lookup_button")}
          </button>
        </div>

        {selectedBatch ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-4 rounded-xl border border-slate-100 p-4 bg-slate-50/50">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
                <QrCode size={32} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-400">ব্যাচ ট্রেসেবিলিটি কোড (QR Verified)</p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck size={12} />
                    Verified Trace
                  </span>
                </div>
                <p className="truncate font-mono text-sm font-bold text-slate-900 mt-1">{selectedBatch.id}</p>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-600">
                  <p className="flex items-center gap-1.5">
                    <User size={13} className="text-slate-400" />
                    <strong>কৃষক:</strong> {selectedBatch.farmerName}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400" />
                    <strong>উৎপাদন এলাকা:</strong> {selectedBatch.location}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Package size={13} className="text-slate-400" />
                    <strong>ফসল ও পরিমাণ:</strong> {selectedBatch.crop} ({selectedBatch.quantityKg.toLocaleString("en-US")} kg)
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400" />
                    <strong>সিন্ক সময়:</strong> {new Date(selectedBatch.synced_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Chain of Custody Real Flow Timeline */}
            <div className="rounded-xl border border-slate-100 p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                চেইন অব কাস্টডি সাপ্লাই চেইন টাইমলাইন (Chain of Custody)
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <div>
                    <strong className="text-slate-900">মাঠপর্যায় সংগ্রহ সম্পন্ন (Farm Harvest Entry)</strong>
                    <div className="text-slate-500 text-[11px]">এজেন্ট কর্তৃক এনআইডি ও ফসল ডাটাবেজে রেকর্ড করা হয়েছে।</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-indigo-50/60 border border-indigo-100">
                  <CheckCircle2 size={16} className="text-indigo-600" />
                  <div>
                    <strong className="text-slate-900">রিয়েল-টাইম Supabase সেন্ট্রাল সিন্ক (Synced to Cloud)</strong>
                    <div className="text-slate-500 text-[11px]">এজেন্ট মোবাইল অ্যাপ থেকে সরাসরি ডাটাবেজে সংরক্ষণ করা হয়েছে।</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
            কোনো রিয়েল-টাইম ব্যাচ ডাটা লোড হয়নি। Agent App থেকে ফসল রেজিস্টার করুন।
          </div>
        )}
      </div>

      {/* Right 2 Cols: Live Batches Quick Roster */}
      <div className="lg:col-span-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center justify-between">
            <span>সাম্প্রতিক রিয়েল-টাইম ব্যাচসমূহ</span>
            <span className="text-xs text-brand-600 font-bold">{batchesList.length} Total</span>
          </h3>

          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {batchesList.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBatch(b)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                  selectedBatch?.id === b.id
                    ? "bg-brand-50/80 border-brand-300 font-semibold"
                    : "bg-slate-50/60 border-slate-100 hover:bg-slate-100"
                }`}
              >
                <div>
                  <div className="font-bold text-slate-900">{b.crop} ({b.quantityKg} kg)</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{b.farmerName} • {b.location}</div>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

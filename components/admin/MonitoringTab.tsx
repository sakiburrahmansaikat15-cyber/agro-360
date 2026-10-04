"use client";

import { useEffect, useState, useMemo } from "react";
import { CheckCircle, XCircle, MapPin, Search, UserCheck, ShieldCheck, Eye, Sprout } from "lucide-react";
import { Card } from "@/components/ui/PageHeader";
import { useT } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase";

type FarmerSubmission = {
  id: string;
  name: string;
  phone: string;
  village: string;
  union_name: string;
  crop: string;
  landDecimal: number;
  status: string;
  synced_at: string;
  agent_name?: string;
  agent_phone?: string;
};

export function MonitoringTab() {
  const t = useT();
  const [submissions, setSubmissions] = useState<FarmerSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "APPROVED" | "PENDING" | "REJECTED">("ALL");
  const [selectedSubmission, setSelectedSubmission] = useState<FarmerSubmission | null>(null);

  useEffect(() => {
    loadSubmissions();

    if (supabase) {
      const channel = supabase
        .channel("monitoring_realtime_tab")
        .on("postgres_changes", { event: "*", schema: "public", table: "farmers" }, loadSubmissions)
        .on("postgres_changes", { event: "*", schema: "public", table: "batches" }, loadSubmissions)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  async function loadSubmissions() {
    setLoading(true);
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("farmers")
        .select("*, agents(name, phone)")
        .order("synced_at", { ascending: false });

      if (!error && data) {
        const formatted: FarmerSubmission[] = data.map((f: any) => ({
          id: f.id,
          name: f.name || "কৃষক",
          phone: f.phone || f.phone_number || "-",
          village: f.village || "-",
          union_name: f.union_name || "-",
          crop: f.crop || "ধান",
          landDecimal: Number(f.landDecimal ?? f.landdecimal) || 0,
          status: f.status || "APPROVED",
          synced_at: f.synced_at || new Date().toISOString(),
          agent_name: f.agents?.name || "মাঠকর্মী",
          agent_phone: f.agents?.phone || "-",
        }));
        setSubmissions(formatted);
      }
    } catch (err) {
      console.error("Error loading submissions:", err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    if (!supabase) return;
    const { error } = await supabase.from("farmers").update({ status: newStatus }).eq("id", id);
    if (!error) {
      loadSubmissions();
      if (selectedSubmission?.id === id) {
        setSelectedSubmission((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    }
  }

  const pendingCount = submissions.filter((s) => s.status === "PENDING" || s.status === "PENDING_APPROVAL").length;
  const approvedCount = submissions.filter((s) => s.status === "APPROVED" || s.status === "ACTIVE").length;
  const rejectedCount = submissions.filter((s) => s.status === "REJECTED").length;

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.village.toLowerCase().includes(q) ||
        s.crop.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (statusFilter === "APPROVED" && s.status !== "APPROVED" && s.status !== "ACTIVE") return false;
      if (statusFilter === "PENDING" && s.status !== "PENDING" && s.status !== "PENDING_APPROVAL") return false;
      if (statusFilter === "REJECTED" && s.status !== "REJECTED") return false;

      return true;
    });
  }, [submissions, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 border-l-4 border-l-amber-500">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
            {t("admin.monitoring.stat_pending")} (অপেক্ষমাণ)
          </div>
          <div className="text-2xl font-bold mt-1 text-slate-900">{pendingCount}</div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 border-l-4 border-l-emerald-500">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
            {t("admin.monitoring.stat_approved")} (অনুমোদিত)
          </div>
          <div className="text-2xl font-bold mt-1 text-slate-900">{approvedCount}</div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 border-l-4 border-l-rose-500">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
            {t("admin.monitoring.stat_rejected")} (বাতিলকৃত)
          </div>
          <div className="text-2xl font-bold mt-1 text-slate-900">{rejectedCount}</div>
        </div>
      </div>

      <Card title={t("admin.monitoring.title")} subtitle={t("admin.monitoring.subtitle")}>
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-3 pb-3 border-b border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by farmer name, phone, village..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === "ALL" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              সব ({submissions.length})
            </button>
            <button
              onClick={() => setStatusFilter("APPROVED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === "APPROVED" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              অনুমোদিত ({approvedCount})
            </button>
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === "PENDING" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              অপেক্ষমাণ ({pendingCount})
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="-mx-5 -mb-5 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">{t("admin.monitoring.th_farmer")}</th>
                <th className="p-4 font-semibold">{t("admin.monitoring.th_agent")}</th>
                <th className="p-4 font-semibold">Location & Crop</th>
                <th className="p-4 font-semibold">{t("admin.monitoring.th_status")}</th>
                <th className="p-4 font-semibold text-right">{t("admin.monitoring.th_actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                    লাইভ সাবমিশন ডেটা লোড হচ্ছে...
                  </td>
                </tr>
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                    কোনো সাবমিশন ডেটা পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => {
                  const isApproved = sub.status === "APPROVED" || sub.status === "ACTIVE";
                  const isRejected = sub.status === "REJECTED";

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-sm text-slate-900">{sub.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{sub.phone}</div>
                      </td>

                      <td className="p-4">
                        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <UserCheck size={13} className="text-brand-600" />
                          {sub.agent_name}
                        </div>
                        <div className="text-[11px] text-slate-400 pl-4">{sub.agent_phone}</div>
                      </td>

                      <td className="p-4">
                        <div className="text-xs text-slate-800 font-medium">
                          {sub.village}, {sub.union_name}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Sprout size={10} /> {sub.crop} ({sub.landDecimal} শতক)
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            isApproved
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isRejected
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {isApproved ? "APPROVED" : isRejected ? "REJECTED" : "PENDING"}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-1">
                          <button
                            onClick={() => setSelectedSubmission(sub)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          {!isApproved && (
                            <button
                              onClick={() => updateStatus(sub.id, "APPROVED")}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                              title="Approve Submission"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          {!isRejected && (
                            <button
                              onClick={() => updateStatus(sub.id, "REJECTED")}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Reject Submission"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <ShieldCheck size={18} className="text-brand-600" />
                কৃষক নিবন্ধন ডেটা মনিটরিং
              </h3>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">কৃষকের নাম:</span>
                  <span className="font-bold text-slate-900">{selectedSubmission.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">মোবাইল:</span>
                  <span className="font-semibold text-slate-800">{selectedSubmission.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">অবস্থান:</span>
                  <span className="font-medium text-slate-800">
                    {selectedSubmission.village}, {selectedSubmission.union_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ফসল ও জমি:</span>
                  <span className="font-semibold text-emerald-700">
                    {selectedSubmission.crop} ({selectedSubmission.landDecimal} শতক)
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-2 mt-2">
                  <span className="text-slate-500">নিবন্ধনকারী এজেন্ট:</span>
                  <span className="font-bold text-brand-700">{selectedSubmission.agent_name}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => updateStatus(selectedSubmission.id, "REJECTED")}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100"
                >
                  Reject Data
                </button>
                <button
                  onClick={() => updateStatus(selectedSubmission.id, "APPROVED")}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-sm"
                >
                  Approve Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

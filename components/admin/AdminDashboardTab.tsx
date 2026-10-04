"use client";

import { useEffect, useState } from "react";
import { Users, CheckSquare, Map, Activity, Sprout, Package, Clock, ShieldCheck, UserPlus, ArrowUpRight } from "lucide-react";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card } from "@/components/ui/PageHeader";
import { useT } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase";

export function AdminDashboardTab() {
  const t = useT();
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    tasksCompleted: 0,
    totalTasks: 0,
    farmersRegistered: 0,
    batchesCreated: 0,
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [activeAgentsList, setActiveAgentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadDashboardData() {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch Agents count
      const { count: totalAgentsCount } = await supabase.from('agents').select('*', { count: 'exact', head: true });
      const { count: activeAgentsCount } = await supabase.from('agents').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE');
      const { data: agentsList } = await supabase.from('agents').select('id, name, phone, status, last_active_at').order('created_at', { ascending: false }).limit(5);
      
      // 2. Fetch Tasks & Task Assignments
      const { count: completedTasksCount } = await supabase.from('task_assignments').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED');
      const { count: totalTasksCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true });
      
      // 3. Fetch Farmers
      const { count: farmersCount, data: recentFarmers } = await supabase.from('farmers').select('*').order('synced_at', { ascending: false }).limit(4);

      // 4. Fetch Batches
      const { count: batchesCount, data: recentBatches } = await supabase.from('batches').select('*').order('synced_at', { ascending: false }).limit(4);

      setStats({
        totalAgents: totalAgentsCount || 0,
        activeAgents: activeAgentsCount || 0,
        tasksCompleted: completedTasksCount || 0,
        totalTasks: totalTasksCount || 0,
        farmersRegistered: farmersCount || 0,
        batchesCreated: batchesCount || 0,
      });

      if (agentsList) {
        setActiveAgentsList(agentsList);
      }

      // Combine recent activities feed
      const feed: any[] = [];
      (recentFarmers || []).forEach((f: any) => {
        feed.push({
          id: `farmer-${f.id}`,
          type: 'FARMER',
          title: `নতুন কৃষক নিবন্ধিত: ${f.name}`,
          subtitle: `${f.village || 'গ্রাম'} · ${f.crop || 'ধান'}`,
          time: f.synced_at,
          status: f.status || 'APPROVED',
        });
      });

      (recentBatches || []).forEach((b: any) => {
        feed.push({
          id: `batch-${b.id}`,
          type: 'BATCH',
          title: `ফসল ব্যাচ তৈরি: ${b.id}`,
          subtitle: `${b.farmerName || b.farmername || 'কৃষক'} · ${b.quantityKg || b.quantitykg || 0} কেজি (${b.crop || 'ধান'})`,
          time: b.synced_at,
          status: 'TAGGED',
        });
      });

      feed.sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());
      setRecentActivities(feed.slice(0, 6));
    } catch (err) {
      console.error("Error loading dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();

    if (supabase) {
      const channel = supabase
        .channel('dashboard_realtime_overview')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, loadDashboardData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'farmers' }, loadDashboardData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'task_assignments' }, loadDashboardData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, loadDashboardData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'batches' }, loadDashboardData)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const taskCompletionRate = stats.totalTasks > 0 ? Math.round((stats.tasksCompleted / stats.totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Users}
          tone="brand"
          label={t("admin.dashboard.total_agents")}
          value={stats.totalAgents.toString()}
          sublabel={`সক্রিয় এজেন্ট: ${stats.activeAgents} জন`}
          trend="up"
          trendValue="Live"
          trendIsGood
        />
        <KpiCard
          icon={Sprout}
          tone="amber"
          label={t("admin.dashboard.farmers_registered")}
          value={stats.farmersRegistered.toString()}
          sublabel="ডিজিটাল Agro-ID কার্ড যুক্ত"
          trend="up"
          trendValue="Realtime"
          trendIsGood
        />
        <KpiCard
          icon={CheckSquare}
          tone="indigo"
          label={t("admin.dashboard.tasks_completed")}
          value={stats.tasksCompleted.toString()}
          sublabel={`সম্পন্ন করার হার: ${taskCompletionRate}%`}
          trend="up"
          trendValue={`${taskCompletionRate}%`}
          trendIsGood
        />
        <KpiCard
          icon={Package}
          tone="teal"
          label="মোট তৈরি ফসল ব্যাচ"
          value={stats.batchesCreated.toString()}
          sublabel="QR ট্রেসেবিলিটি ট্যাগিং"
          trend="up"
          trendValue="Synced"
          trendIsGood
        />
      </div>

      {/* ── Dashboard Grid: Recent Activity Feed & Active Agents Overview ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Activity Feed (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card 
            title="সাম্প্রতিক লাইভ ফিল্ড অ্যাক্টিভিটি (Real-time Feed)" 
            subtitle="মাঠপর্যায়ের এজেন্টদের সংগৃহীত লাইভ তথ্য ও ব্যাচ ট্রেসেবিলিটি"
          >
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                ডাটাবেজ লোড হচ্ছে...
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="p-4 flex flex-col items-center justify-center text-slate-400 py-12">
                <Activity className="h-10 w-10 mb-3 text-slate-200" />
                <p className="text-sm font-medium">কোনো সাম্প্রতিক অ্যাক্টিভিটি পাওয়া যায়নি</p>
                <p className="text-xs mt-1 text-slate-400">
                  এজেন্ট অ্যাপ থেকে নতুন তথ্য জমা দিলে রিয়েল-টাইমে এখানে দেখা যাবে।
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 -mx-5 -mb-5 mt-3">
                {recentActivities.map((act) => (
                  <div key={act.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 ${
                        act.type === 'FARMER' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {act.type === 'FARMER' ? <UserPlus size={18} /> : <Package size={18} />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{act.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{act.subtitle}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        act.type === 'FARMER'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {act.status}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {act.time ? new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "এখনই"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Active Agents Overview Panel (1 Col) */}
        <div className="space-y-6">
          <Card 
            title="মাঠপর্যায়ের এজেন্ট ওভারভিউ" 
            subtitle="নিবন্ধিত এজেন্ট ও স্ট্যাটাস"
          >
            {activeAgentsList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                কোনো এজেন্ট নিবন্ধিত নেই
              </div>
            ) : (
              <div className="space-y-3 mt-2">
                {activeAgentsList.map((agent) => (
                  <div key={agent.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center text-brand-800 font-bold text-xs">
                        {agent.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{agent.name}</div>
                        <div className="text-[11px] text-slate-500">{agent.phone}</div>
                      </div>
                    </div>

                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                      agent.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {agent.status || 'ACTIVE'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

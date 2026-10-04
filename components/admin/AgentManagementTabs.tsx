"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Map,
  CheckSquare,
  Activity,
  ShieldAlert,
  Radio,
} from "lucide-react";
import { AdminDashboardTab } from "./AdminDashboardTab";
import { AgentsTab } from "./AgentsTab";
import { AreasTab } from "./AreasTab";
import { TasksTab } from "./TasksTab";
import { TrackingTab } from "./TrackingTab";
import { MonitoringTab } from "./MonitoringTab";
import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import { useT } from "@/lib/i18n/context";

export type TabId = "dashboard" | "agents" | "areas" | "tasks" | "tracking" | "monitoring";

// Note: labelBn/key are typed as plain `string` (not string literals) on
// purpose. With `as const` here, TS infers labelBn as a non-empty string
// *literal*, which it can prove is always truthy — that makes the `|| t(...)`
// fallback below unreachable in TS's control-flow analysis and (in this
// TS version) causes `tab` to be inferred as `never` inside it. Widening
// to `string` keeps the runtime behavior identical while avoiding that.
const tabsConfig: { id: TabId; key: string; labelBn: string; icon: LucideIcon }[] = [
  { id: "dashboard", key: "admin.tabs.dashboard", labelBn: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { id: "agents", key: "admin.tabs.agents", labelBn: "এজেন্ট ব্যবস্থাপনা", icon: Users },
  { id: "areas", key: "admin.tabs.areas", labelBn: "এলাকা নির্ধারণ", icon: Map },
  { id: "tasks", key: "admin.tabs.tasks", labelBn: "টাস্ক তৈরি ও বরাদ্দ", icon: CheckSquare },
  { id: "tracking", key: "admin.tabs.tracking", labelBn: "লাইভ ট্র্যাকিং", icon: Activity },
  { id: "monitoring", key: "admin.tabs.monitoring", labelBn: "ডেটা মনিটরিং", icon: ShieldAlert },
];

export function AgentManagementTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const t = useT();

  return (
    <div className="space-y-6">
      {/* ── Top Header Navigation Bar ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2 pb-2 sm:pb-0">
          {/* Module Title & Status Pill */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 items-center justify-center rounded-xl bg-brand-50 border border-brand-100 flex">
              <Users className="h-5 w-5 text-brand-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">
                  মাঠপর্যায়ের এজেন্ট কন্ট্রোল সেন্টার
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-600" />
                  রিয়েল-টাইম লাইভ
                </span>
              </div>
              <p className="text-xs text-slate-500">
                এজেন্ট পরিচালনা, এলাকা ও কাজ বণ্টন, ট্র্যাকিং এবং ডেটা মনিটরিং
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation Row */}
        <div className="mt-3 border-t border-slate-100 pt-2">
          <nav className="flex space-x-1 overflow-x-auto pb-1" aria-label="Tabs">
            {tabsConfig.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    "flex items-center gap-2.5 whitespace-nowrap rounded-xl py-2.5 px-4 text-xs font-semibold transition-all shrink-0",
                    isActive
                      ? "bg-brand-600 text-white shadow-md shadow-brand-600/20"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon size={16} className={isActive ? "text-white" : "text-slate-400"} />
                  <span>{tab.labelBn || t(tab.key)}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Tab Content Container ── */}
      <div className="transition-all duration-200">
        {activeTab === "dashboard" && <AdminDashboardTab />}
        {activeTab === "agents" && <AgentsTab />}
        {activeTab === "areas" && <AreasTab />}
        {activeTab === "tasks" && <TasksTab />}
        {activeTab === "tracking" && <TrackingTab />}
        {activeTab === "monitoring" && <MonitoringTab />}
      </div>
    </div>
  );
}

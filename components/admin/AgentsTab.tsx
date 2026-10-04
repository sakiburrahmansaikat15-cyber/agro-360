"use client";

import { useEffect, useState, useMemo } from "react";
import { Users, Shield, MapPin, CheckCircle, Clock, X, Trash2, Search, Plus, Key, LogIn, Phone } from "lucide-react";
import { Card } from "@/components/ui/PageHeader";
import { useT } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase";

type Agent = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  status: string;
  last_active_at: string;
  role: string;
  created_at: string;
};

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers["Authorization"] = `Bearer ${data.session.access_token}`;
    }
  }
  return headers;
}

export function AgentsTab() {
  const t = useT();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "OFFLINE">("ALL");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: "", phone: "", role: "Field Agent", password: "" });

  useEffect(() => {
    loadAgents();

    if (supabase) {
      const channel = supabase
        .channel('agents_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, loadAgents)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  async function loadAgents() {
    setLoading(true);
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from('agents').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setAgents(data);
    }
    setLoading(false);
  }

  const generatePassword = () => {
    // 12 random alphanumeric characters via the Web Crypto API — far higher
    // entropy than the previous 6-digit numeric password (~900k possibilities).
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    const bytes = new Uint32Array(12);
    crypto.getRandomValues(bytes);
    const randomPass = Array.from(bytes, (b) => chars[b % chars.length]).join("");
    setNewAgent((prev) => ({ ...prev, password: randomPass }));
  };

  async function handleAddAgent(e: React.FormEvent) {
    e.preventDefault();

    if (!newAgent.name || !newAgent.phone || !newAgent.password) {
      alert('Please fill in all fields.');
      return;
    }

    if (newAgent.password.length < 8) {
      alert('Password must be at least 8 characters.');
      return;
    }

    try {
      const res = await fetch('/api/create-agent', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          name: newAgent.name,
          phone: newAgent.phone,
          password: newAgent.password,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        if (result.error?.includes('already registered') || result.error?.includes('duplicate')) {
          alert(`⚠️ এই ফোন নম্বরটি ইতিমধ্যে ব্যবহৃত হয়েছে।\nThis phone number is already registered.`);
        } else {
          alert('❌ Error: ' + result.error);
        }
        return;
      }

      setIsAddOpen(false);
      setNewAgent({ name: '', phone: '', role: 'Field Agent', password: '' });
      loadAgents();
      alert(`✅ এজেন্ট তৈরি হয়েছে!\nAgent "${newAgent.name}" created.\n\nAgent Login Credentials:\nPhone: ${newAgent.phone}\nPassword: ${newAgent.password}`);
    } catch (err) {
      console.error(err);
      alert('Network error. Please try again.');
    }
  }

  async function handleDeleteAgent(id: string, name: string) {
    if (!supabase || !confirm(`Are you sure you want to terminate/delete agent "${name}"?`)) return;
    await supabase.from('agents').delete().eq('id', id);
    loadAgents();
  }

  async function testAgentLogin(phone: string) {
    const testPhone = prompt(`Test login for this agent.\nEnter phone number:`, phone || '');
    if (!testPhone) return;
    const testPass = prompt('Enter the password set for this agent:');
    if (!testPass) return;

    const res = await fetch('/api/test-login', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ phone: testPhone, password: testPass }),
    });
    const result = await res.json();

    if (result.success) {
      alert(`✅ LOGIN SUCCESSFUL!\nEmail: ${result.email_tried}\nUser ID: ${result.user_id}\n\nThe agent app login is verified.`);
    } else {
      alert(`❌ LOGIN FAILED\nEmail tried: ${result.email_tried}\nError: ${result.error}`);
    }
  }

  // Filtered Agents
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || agent.name.toLowerCase().includes(q) || agent.phone.includes(q);
      if (!matchSearch) return false;

      if (statusFilter === "ACTIVE" && agent.status !== "ACTIVE") return false;
      if (statusFilter === "OFFLINE" && agent.status === "ACTIVE") return false;

      return true;
    });
  }, [agents, searchQuery, statusFilter]);

  return (
    <>
      <Card 
        title={t("admin.agents.title")} 
        subtitle={t("admin.agents.subtitle")}
        action={
          <button 
            onClick={() => setIsAddOpen(true)}
            className="bg-brand-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-brand-700 transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} /> {t("admin.agents.add_btn")}
          </button>
        }
      >
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-3 pb-3 border-b border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search agent by name or phone..."
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
              সব ({agents.length})
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === "ACTIVE" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              সক্রিয় ({agents.filter(a => a.status === 'ACTIVE').length})
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="-mx-5 -mb-5 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">{t("admin.agents.th_name")}</th>
                <th className="p-4 font-semibold">{t("admin.agents.th_role")}</th>
                <th className="p-4 font-semibold">{t("admin.agents.th_status")}</th>
                <th className="p-4 font-semibold">{t("admin.agents.th_last_active")}</th>
                <th className="p-4 font-semibold text-right">{t("admin.agents.th_actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">এজেন্ট তালিকা লোড হচ্ছে...</td>
                </tr>
              ) : filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">কোনো এজেন্ট পাওয়া যায়নি</td>
                </tr>
              ) : (
                filteredAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 font-bold text-xs">
                          {(agent.name || "A").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900">{agent.name || "Unknown"}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone size={12} className="text-slate-400" /> {agent.phone || "No phone"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                        <Shield size={13} className="text-brand-600" /> {agent.role || "Field Agent"}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        agent.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {agent.status === 'ACTIVE' ? (
                          <>
                            <CheckCircle size={12} className="text-emerald-600" /> {t("admin.agents.status_active")}
                          </>
                        ) : (
                          <>
                            <Clock size={12} className="text-slate-400" /> {t("admin.agents.status_offline")}
                          </>
                        )}
                      </span>
                    </td>

                    <td className="p-4 text-xs text-slate-500">
                      {agent.last_active_at ? new Date(agent.last_active_at).toLocaleString() : "এখনই তৈরি করা হয়েছে"}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => testAgentLogin(agent.phone)}
                          className="px-2.5 py-1 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 border border-brand-200"
                          title="Test Agent App Login"
                        >
                          <LogIn size={13} /> Test Login
                        </button>
                        <button 
                          onClick={() => handleDeleteAgent(agent.id, agent.name)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                          title="Terminate / Delete Agent"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Agent Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">নতুন মাঠপর্যায়ের এজেন্ট তৈরি করুন</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddAgent} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">এজেন্টের নাম | Full Name</label>
                <input
                  required
                  type="text"
                  value={newAgent.name}
                  onChange={e => setNewAgent({...newAgent, name: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. Rahim Uddin"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">ফোন নম্বর (লগইন আইডি) | Phone Number</label>
                <input
                  required
                  type="text"
                  value={newAgent.phone}
                  onChange={e => setNewAgent({...newAgent, phone: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="01796133638"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">পাসওয়ার্ড | Password</label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-[11px] text-brand-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Key size={12} /> পাসওয়ার্ড জেনারেট করুন
                  </button>
                </div>
                <input
                  required
                  type="text"
                  value={newAgent.password}
                  onChange={e => setNewAgent({...newAgent, password: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  placeholder="Set temporary login password"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">রোল | Agent Role</label>
                <select
                  value={newAgent.role}
                  onChange={e => setNewAgent({...newAgent, role: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="Field Agent">Field Agent (মাঠকর্মী)</option>
                  <option value="Supervisor">Supervisor (সুপারভাইজার)</option>
                  <option value="Manager">Manager (ব্যবস্থাপক)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-sm"
                >
                  Save & Create Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

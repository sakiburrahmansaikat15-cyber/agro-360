"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Edit2, Trash2, X, Search, Check, ChevronDown, UserCheck, Users, MapPin, Globe } from "lucide-react";
import { Card } from "@/components/ui/PageHeader";
import { useT } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase";
import { all8Divisions, all64Districts, getUpazilasForDistrict, getUnionsForUpazila, getDistrictsForDivision } from "@/lib/bangladeshData";

type Agent = {
  id: string;
  name: string;
  phone: string;
  status: string;
};

type AssignedArea = {
  id: string;
  agent_id?: string | null;
  division: string;
  district: string;
  upazila: string;
  union_name: string;
  agent_name?: string;
  agent_phone?: string;
};

export function AreasTab() {
  const t = useT();
  const [areas, setAreas] = useState<AssignedArea[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [newArea, setNewArea] = useState({
    division: "Dhaka",
    district: "",
    upazila: "",
    union_name: "",
  });
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  
  // Dropdown & Search state
  const [agentSearch, setAgentSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();

    if (supabase) {
      const channel = supabase
        .channel('areas_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'assigned_areas' }, loadData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, loadData)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    // Close dropdown on outside click
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadData() {
    setLoading(true);
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch Agents
      const { data: agentsData } = await supabase
        .from("agents")
        .select("id, name, phone, status")
        .order("name", { ascending: true });

      if (agentsData) {
        setAgents(agentsData);
      }

      // 2. Fetch Assigned Areas
      const { data: areasData } = await supabase
        .from("assigned_areas")
        .select("*, agents(id, name, phone)")
        .order("created_at", { ascending: false });

      if (areasData) {
        const formattedAreas: AssignedArea[] = areasData.map((item: any) => ({
          id: item.id,
          agent_id: item.agent_id,
          division: item.division || "",
          district: item.district || "",
          upazila: item.upazila || "",
          union_name: item.union_name || "",
          agent_name: item.agents?.name || "Unassigned",
          agent_phone: item.agents?.phone || "-",
        }));
        setAreas(formattedAreas);
      }
    } catch (err) {
      console.error("Error loading areas/agents data:", err);
    } finally {
      setLoading(false);
    }
  }

  const toggleAgentSelection = (agentId: string) => {
    setSelectedAgentIds((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  const selectAllAgents = () => {
    if (selectedAgentIds.length === filteredAgents.length) {
      setSelectedAgentIds([]);
    } else {
      setSelectedAgentIds(filteredAgents.map((a) => a.id));
    }
  };

  async function handleAddArea(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setIsAddOpen(false);
      return;
    }

    if (!newArea.district || !newArea.upazila) {
      alert("Please fill in District and Upazila.");
      return;
    }

    try {
      if (selectedAgentIds.length > 0) {
        // Create an assigned area record for EACH selected agent
        const recordsToInsert = selectedAgentIds.map((agentId) => ({
          agent_id: agentId,
          division: newArea.division,
          district: newArea.district,
          upazila: newArea.upazila,
          union_name: newArea.union_name,
        }));

        const { error } = await supabase.from("assigned_areas").insert(recordsToInsert);
        if (error) {
          alert("Error assigning area: " + error.message);
          return;
        }
      } else {
        // Insert unassigned area record
        const { error } = await supabase.from("assigned_areas").insert([
          {
            division: newArea.division,
            district: newArea.district,
            upazila: newArea.upazila,
            union_name: newArea.union_name,
          },
        ]);
        if (error) {
          alert("Error assigning area: " + error.message);
          return;
        }
      }

      setIsAddOpen(false);
      setNewArea({ division: "Dhaka", district: "", upazila: "", union_name: "" });
      setSelectedAgentIds([]);
      setAgentSearch("");
      loadData();
    } catch (err: any) {
      alert("Failed to save area: " + err?.message);
    }
  }

  async function handleDeleteArea(id: string) {
    if (!supabase || !confirm("Are you sure you want to remove this area assignment?")) return;
    await supabase.from("assigned_areas").delete().eq("id", id);
    loadData();
  }

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(agentSearch.toLowerCase()) ||
      agent.phone.includes(agentSearch)
  );

  return (
    <>
      <Card
        title={t("admin.areas.title")}
        subtitle={t("admin.areas.subtitle")}
        action={
          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-brand-600 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} /> {t("admin.areas.add_btn")}
          </button>
        }
      >
        {/* Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-3 pb-3 border-b border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={agentSearch}
              onChange={(e) => setAgentSearch(e.target.value)}
              placeholder="Search area by district, upazila or agent..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            মোট এলাকা নির্ধারণ: <span className="font-bold text-slate-900">{areas.length} টি</span>
          </div>
        </div>

        <div className="-mx-5 -mb-5 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Assigned Agent</th>
                <th className="p-4 font-semibold">{t("admin.areas.th_division")}</th>
                <th className="p-4 font-semibold">{t("admin.areas.th_district")}</th>
                <th className="p-4 font-semibold">{t("admin.areas.th_upazila")}</th>
                <th className="p-4 font-semibold">{t("admin.areas.th_union")}</th>
                <th className="p-4 font-semibold">{t("admin.areas.th_coverage")}</th>
                <th className="p-4 font-semibold text-right">{t("admin.areas.th_actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    Loading area assignments...
                  </td>
                </tr>
              ) : areas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                    {t("admin.areas.empty")}
                  </td>
                </tr>
              ) : (
                areas
                  .filter((a) => {
                    const q = agentSearch.toLowerCase().trim();
                    return (
                      !q ||
                      (a.agent_name || "").toLowerCase().includes(q) ||
                      a.district.toLowerCase().includes(q) ||
                      a.upazila.toLowerCase().includes(q) ||
                      (a.union_name || "").toLowerCase().includes(q)
                    );
                  })
                  .map((area) => (
                    <tr key={area.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                          <Users size={14} className="text-brand-600" />
                          {area.agent_name || "Unassigned"}
                        </div>
                        {area.agent_phone ? (
                          <div className="text-xs text-slate-400 pl-6">{area.agent_phone}</div>
                        ) : null}
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-900">{area.division}</td>
                      <td className="p-4 text-xs">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {area.district}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-600">{area.upazila}</td>
                      <td className="p-4 text-xs text-slate-600">{area.union_name || "-"}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                          Assigned
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleDeleteArea(area.id)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                            title="Unassign Area"
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

      {/* Assign Area Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-semibold text-lg text-slate-900">
                এলাকা নির্ধারণ করুন | Assign Area
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddArea} className="p-5 space-y-4">
              {/* Searchable Multi-Select Agents Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>এজেন্ট নির্বাচন করুন | Select Agent(s)</span>
                  <span className="text-xs text-brand-600 font-normal">
                    {selectedAgentIds.length} selected
                  </span>
                </label>

                {/* Selected Agent Badges */}
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="min-h-[44px] w-full border border-slate-200 rounded-lg p-2 bg-white flex flex-wrap items-center gap-1.5 cursor-pointer focus-within:ring-2 focus-within:ring-brand-500"
                >
                  {selectedAgentIds.length === 0 ? (
                    <span className="text-sm text-slate-400 px-1">
                      Search or select agents from list...
                    </span>
                  ) : (
                    selectedAgentIds.map((id) => {
                      const agentObj = agents.find((a) => a.id === id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 bg-brand-50 text-brand-800 border border-brand-200 text-xs px-2 py-1 rounded-md font-medium"
                        >
                          <UserCheck size={12} />
                          {agentObj ? `${agentObj.name} (${agentObj.phone})` : id}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAgentSelection(id);
                            }}
                            className="hover:text-red-600 ml-0.5"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })
                  )}
                  <ChevronDown size={16} className="text-slate-400 ml-auto" />
                </div>

                {/* Dropdown Options Box */}
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-60 overflow-hidden flex flex-col">
                    {/* Search Input inside Dropdown */}
                    <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                      <Search size={16} className="text-slate-400 ml-1" />
                      <input
                        type="text"
                        value={agentSearch}
                        onChange={(e) => setAgentSearch(e.target.value)}
                        placeholder="Search agent by name or phone..."
                        className="w-full text-xs bg-transparent focus:outline-none py-1"
                        autoFocus
                      />
                      {filteredAgents.length > 0 && (
                        <button
                          type="button"
                          onClick={selectAllAgents}
                          className="text-[11px] font-medium text-brand-600 hover:underline shrink-0"
                        >
                          {selectedAgentIds.length === filteredAgents.length ? "Deselect All" : "Select All"}
                        </button>
                      )}
                    </div>

                    {/* Agent Option List */}
                    <div className="overflow-y-auto max-h-48 divide-y divide-slate-50">
                      {filteredAgents.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">
                          No agents found. Create agents in Agent Management first.
                        </div>
                      ) : (
                        filteredAgents.map((agent) => {
                          const isSelected = selectedAgentIds.includes(agent.id);
                          return (
                            <div
                              key={agent.id}
                              onClick={() => toggleAgentSelection(agent.id)}
                              className={`flex items-center justify-between p-2.5 hover:bg-slate-50 cursor-pointer text-xs transition-colors ${
                                isSelected ? "bg-brand-50/50 font-medium" : ""
                              }`}
                            >
                              <div>
                                <div className="text-slate-900 font-medium">{agent.name}</div>
                                <div className="text-slate-400 text-[11px]">{agent.phone}</div>
                              </div>
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? "bg-brand-600 border-brand-600 text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isSelected && <Check size={12} strokeWidth={3} />}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Area Fields */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    বিভাগ | Division (৮ বিভাগ)
                  </label>
                  <select
                    value={newArea.division}
                    onChange={(e) => {
                      // Changing division invalidates any previously chosen
                      // district/upazila from a different division, so it
                      // must never list all 64 districts regardless of the
                      // selected division.
                      const nextDivision = e.target.value;
                      const districtsForDivision = getDistrictsForDivision(nextDivision);
                      const stillValid = districtsForDivision.includes(newArea.district);
                      setNewArea({
                        ...newArea,
                        division: nextDivision,
                        district: stillValid ? newArea.district : "",
                        upazila: stillValid ? newArea.upazila : "",
                      });
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    {all8Divisions.map((div) => (
                      <option key={div.id} value={div.en}>
                        {div.en} ({div.bn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    জেলা | District ({getDistrictsForDivision(newArea.division).length} in {newArea.division})
                  </label>
                  <select
                    required
                    value={newArea.district}
                    onChange={(e) => {
                      const d = e.target.value;
                      const upList = getUpazilasForDistrict(d);
                      setNewArea({
                        ...newArea,
                        district: d,
                        upazila: upList[0] || "",
                      });
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-medium"
                  >
                    <option value="">-- জেলা নির্বাচন করুন ( Select District ) --</option>
                    {(getDistrictsForDivision(newArea.division).length > 0
                      ? getDistrictsForDivision(newArea.division)
                      : all64Districts
                    ).map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    উপজেলা | Upazila (স্বয়ংক্রিয় লোড)
                  </label>
                  <select
                    required
                    value={newArea.upazila}
                    onChange={(e) => {
                      const u = e.target.value;
                      const unionList = getUnionsForUpazila(u);
                      setNewArea({
                        ...newArea,
                        upazila: u,
                        union_name: unionList[0] || "",
                      });
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white font-medium"
                    disabled={!newArea.district}
                  >
                    {!newArea.district ? (
                      <option value="">প্রথমে জেলা নির্বাচন করুন</option>
                    ) : (
                      getUpazilasForDistrict(newArea.district).map((up) => (
                        <option key={up} value={up}>
                          {up}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ইউনিয়ন | Union (স্বয়ংক্রিয় ড্রপডাউন)
                  </label>
                  <select
                    value={newArea.union_name}
                    onChange={(e) => setNewArea({ ...newArea, union_name: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    disabled={!newArea.upazila}
                  >
                    {!newArea.upazila ? (
                      <option value="">প্রথমে উপজেলা নির্বাচন করুন</option>
                    ) : (
                      getUnionsForUpazila(newArea.upazila).map((un) => (
                        <option key={un} value={un}>
                          {un}
                        </option>
                      ))
                    )}
                  </select>
                </div>
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
                  className="px-4 py-2 text-xs font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-sm"
                >
                  Save Area Assignment ({selectedAgentIds.length || 1})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

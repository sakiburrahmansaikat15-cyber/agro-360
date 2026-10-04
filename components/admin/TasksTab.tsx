"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, X, Search, Check, ChevronDown, UserCheck, Users, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/PageHeader";
import { useT } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase";

type Agent = {
  id: string;
  name: string;
  phone: string;
  status: string;
};

type TaskItem = {
  id: string;
  title: string;
  description?: string;
  priority: string;
  due_date?: string;
  assigned_agents?: { id: string; name: string; phone: string }[];
  assignments_count: number;
  completed_count: number;
  overall_status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  completed_at: string | null;
  completed_by_agent: string | null;
};

export function TasksTab() {
  const t = useT();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form state
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "NORMAL",
    due_date: "",
  });
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [agentSearch, setAgentSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();

    if (supabase) {
      const channel = supabase
        .channel('tasks_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, loadData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'task_assignments' }, loadData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, loadData)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

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

      // 2. Fetch Tasks with task_assignments
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*, task_assignments(*, agents(id, name, phone))")
        .order("created_at", { ascending: false });

      if (tasksData) {
        const formattedTasks: TaskItem[] = tasksData.map((item: any) => {
          const assignments = item.task_assignments || [];
          const assignedAgents = assignments.map((ta: any) => ta.agents).filter(Boolean);
          const completedAssignments = assignments.filter((ta: any) => ta.status === 'COMPLETED');

          let overallStatus: TaskItem["overall_status"] = 'PENDING';
          if (assignments.length > 0 && completedAssignments.length === assignments.length) {
            overallStatus = 'COMPLETED';
          } else if (completedAssignments.length > 0) {
            overallStatus = 'IN_PROGRESS';
          }

          const latestCompleted = completedAssignments.sort((a: any, b: any) => 
            new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime()
          )[0];

          return {
            id: item.id,
            title: item.title,
            description: item.description,
            priority: item.priority || "NORMAL",
            due_date: item.due_date,
            assigned_agents: assignedAgents,
            assignments_count: assignments.length,
            completed_count: completedAssignments.length,
            overall_status: overallStatus,
            completed_at: latestCompleted?.completed_at || null,
            completed_by_agent: latestCompleted?.agents?.name || null,
          };
        });
        setTasks(formattedTasks);
      }
    } catch (err) {
      console.error("Error loading tasks:", err);
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

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setIsAddOpen(false);
      return;
    }

    if (!newTask.title.trim()) {
      alert("Please enter a task title.");
      return;
    }

    try {
      // Step 1: Insert into tasks table
      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .insert([
          {
            title: newTask.title.trim(),
            description: newTask.description.trim(),
            priority: newTask.priority,
            due_date: newTask.due_date || null,
          },
        ])
        .select()
        .single();

      if (taskError) {
        alert("Error creating task: " + taskError.message);
        return;
      }

      // Step 2: Assign task to selected agents in task_assignments table
      if (taskData && selectedAgentIds.length > 0) {
        const assignments = selectedAgentIds.map((agentId) => ({
          task_id: taskData.id,
          agent_id: agentId,
          status: "PENDING",
        }));

        const { error: assignError } = await supabase.from("task_assignments").insert(assignments);
        if (assignError) {
          console.error("Error linking agents to task:", assignError);
        }
      }

      setIsAddOpen(false);
      setNewTask({ title: "", description: "", priority: "NORMAL", due_date: "" });
      setSelectedAgentIds([]);
      setAgentSearch("");
      loadData();
    } catch (err: any) {
      alert("Failed to save task: " + err?.message);
    }
  }

  async function handleDeleteTask(id: string) {
    if (!supabase || !confirm("Are you sure you want to delete this task?")) return;
    await supabase.from("tasks").delete().eq("id", id);
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
        title={t("admin.tasks.title")}
        subtitle={t("admin.tasks.subtitle")}
        action={
          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-brand-600 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} /> {t("admin.tasks.create_btn")}
          </button>
        }
      >
        {loading ? (
          <div className="py-12 flex items-center justify-center text-slate-400">
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <Users className="h-12 w-12 mb-3 text-slate-300" />
            <p className="text-sm font-medium">{t("admin.tasks.empty_title")}</p>
            <p className="text-xs mt-1">{t("admin.tasks.empty_sub")}</p>
          </div>
        ) : (
          <div className="-mx-5 -mb-5 mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">{t("admin.tasks.th_title")}</th>
                  <th className="p-4 font-semibold">Assigned Agent(s)</th>
                  <th className="p-4 font-semibold">{t("admin.tasks.th_priority")}</th>
                  <th className="p-4 font-semibold">{t("admin.tasks.th_due_date")}</th>
                  <th className="p-4 font-semibold">{t("admin.tasks.th_status")}</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="text-sm font-medium text-slate-900">{task.title}</div>
                      {task.description ? (
                        <div className="text-xs text-slate-400 mt-0.5">{task.description}</div>
                      ) : null}
                    </td>

                    {/* Assigned Agents Column */}
                    <td className="p-4">
                      {!task.assigned_agents || task.assigned_agents.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {task.assigned_agents.map((ag) => (
                            <span
                              key={ag.id}
                              className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded-full font-medium"
                            >
                              <Users size={10} className="text-brand-600" />
                              {ag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ${
                          task.priority === "HIGH"
                            ? "bg-rose-50 text-rose-700 ring-rose-600/20"
                            : task.priority === "MEDIUM"
                            ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                            : task.priority === "NORMAL"
                            ? "bg-blue-50 text-blue-700 ring-blue-600/20"
                            : "bg-slate-50 text-slate-700 ring-slate-600/20"
                        }`}
                      >
                        {task.priority || "NORMAL"}
                      </span>
                    </td>

                    <td className="p-4 text-sm text-slate-600">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : "-"}
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ring-1 ring-inset ${
                            task.overall_status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                              : task.overall_status === "IN_PROGRESS"
                              ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                              : "bg-slate-50 text-slate-700 ring-slate-600/20"
                          }`}
                        >
                          {task.overall_status === "COMPLETED"
                            ? "✅ COMPLETED"
                            : task.overall_status === "IN_PROGRESS"
                            ? `⏳ IN PROGRESS (${task.completed_count}/${task.assignments_count})`
                            : "PENDING"}
                        </span>
                        {task.completed_at ? (
                          <span className="text-[11px] text-slate-400">
                            Done: {new Date(task.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded-md hover:bg-red-50"
                        title="Delete Task"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Task Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-semibold text-lg text-slate-900">
                টাস্ক তৈরি করুন | Create Task
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  টাস্কের শিরোনাম | Task Title
                </label>
                <input
                  required
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. Survey 20 farmers in Shibganj"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  বিবরণ (ঐচ্ছিক) | Description (Optional)
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Enter task details..."
                />
              </div>

              {/* Searchable Multi-Select Agents Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>এজেন্ট নির্ধারণ করুন | Assign Agent(s)</span>
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
                    <span className="text-xs text-slate-400 px-1">
                      Search or select agents to assign...
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
                          {selectedAgentIds.length === filteredAgents.length
                            ? "Deselect All"
                            : "Select All"}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    অগ্রাধিকার | Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="LOW">Low (কম)</option>
                    <option value="NORMAL">Normal (সাধারণ)</option>
                    <option value="MEDIUM">Medium (মাঝারি)</option>
                    <option value="HIGH">High (জরুরি)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    শেষ তারিখ | Due Date
                  </label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  />
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
                  Save Task ({selectedAgentIds.length} Agents)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

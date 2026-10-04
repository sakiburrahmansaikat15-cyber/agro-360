import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  CheckSquare,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  X,
  ChevronRight,
  ShieldCheck,
  Info,
} from "lucide-react-native";

import { AppText } from "@/components/ui/AppText";
import { HERO_GRADIENT, COLORS } from "@/constants/theme";
import { Badge } from "@/components/ui/Badge";
import { useUser } from "@/lib/context/UserContext";
import { useLanguage, useT } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase";

export type AssignedTask = {
  assignment_id: string;
  task_id: string;
  title: string;
  description?: string;
  priority: "HIGH" | "MEDIUM" | "LOW" | "NORMAL";
  due_date?: string;
  status: "PENDING" | "COMPLETED" | "IN_PROGRESS";
  completed_at?: string | null;
  created_at?: string;
};

type FilterStatus = "ALL" | "PENDING" | "COMPLETED";
type FilterPriority = "ALL" | "HIGH" | "MEDIUM" | "LOW";

export default function TasksScreen() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLanguage();
  const { user, agent } = useUser();

  const [tasks, setTasks] = useState<AssignedTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>("ALL");

  const fetchAssignedTasks = async () => {
    if (!supabase || (!user && !agent)) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      let agentDbId = agent?.id;
      if (!agentDbId && user) {
        const rawPhone = (user.email || "").split("@")[0];
        const { data: agentData } = await supabase
          .from("agents")
          .select("id")
          .or(`user_id.eq.${user.id},phone.eq.${rawPhone}`)
          .maybeSingle();
        agentDbId = agentData?.id;
      }

      if (!agentDbId) {
        setTasks([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Query task_assignments joined with tasks
      const { data, error } = await supabase
        .from("task_assignments")
        .select("id, status, completed_at, task_id, tasks(id, title, description, priority, due_date, created_at)")
        .eq("agent_id", agentDbId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tasks:", error);
      } else if (data) {
        const formatted: AssignedTask[] = data.map((item: any) => ({
          assignment_id: item.id,
          task_id: item.task_id,
          title: item.tasks?.title || "অ্যাসাইনকৃত টাস্ক",
          description: item.tasks?.description || "",
          priority: (item.tasks?.priority || "NORMAL") as any,
          due_date: item.tasks?.due_date || "",
          status: item.status || "PENDING",
          completed_at: item.completed_at || null,
          created_at: item.tasks?.created_at || "",
        }));
        setTasks(formatted);
      }
    } catch (err) {
      console.error("Task fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssignedTasks();

    // Real-time channel listener
    if (supabase) {
      const channel = supabase
        .channel("realtime_agent_tasks_tab")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "task_assignments" },
          () => fetchAssignedTasks()
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "tasks" },
          () => fetchAssignedTasks()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, agent]);

  // Toggle Task Status (Optimistic + Supabase Realtime)
  const toggleTaskStatus = async (task: AssignedTask) => {
    if (!supabase) return;

    const isCurrentlyCompleted = task.status === "COMPLETED";
    const newStatus = isCurrentlyCompleted ? "PENDING" : "COMPLETED";
    const nowIso = new Date().toISOString();

    // Optimistic UI Update
    setTasks((prev) =>
      prev.map((t) =>
        t.assignment_id === task.assignment_id
          ? { ...t, status: newStatus, completed_at: newStatus === "COMPLETED" ? nowIso : null }
          : t
      )
    );

    try {
      const { error } = await supabase
        .from("task_assignments")
        .update({
          status: newStatus,
          completed_at: newStatus === "COMPLETED" ? nowIso : null,
        })
        .eq("id", task.assignment_id);

      if (error) {
        console.error("Failed to update task assignment status:", error);
        fetchAssignedTasks(); // Rollback on error
      }
    } catch (err) {
      console.error("Error toggling task status:", err);
      fetchAssignedTasks();
    }
  };

  // Metrics
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const pendingCount = totalCount - completedCount;
  const highPriorityCount = tasks.filter((t) => t.priority === "HIGH" && t.status !== "COMPLETED").length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filtered Task List
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Status Filter
      if (statusFilter === "PENDING" && task.status === "COMPLETED") return false;
      if (statusFilter === "COMPLETED" && task.status !== "COMPLETED") return false;

      // Priority Filter
      if (priorityFilter !== "ALL") {
        if (priorityFilter === "HIGH" && task.priority !== "HIGH") return false;
        if (priorityFilter === "MEDIUM" && task.priority !== "MEDIUM" && task.priority !== "NORMAL") return false;
        if (priorityFilter === "LOW" && task.priority !== "LOW") return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = (task.description || "").toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }

      return true;
    });
  }, [tasks, statusFilter, priorityFilter, searchQuery]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* ── Premium Hero Header Banner ── */}
      <LinearGradient
        colors={HERO_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        {/* Top Header Row */}
        <View style={styles.topRow}>
          <View>
            <View style={styles.brandBadge}>
              <ShieldCheck size={12} color="#86efac" />
              <AppText weight="bold" style={styles.brandBadgeText}>
                DAE ফিল্ড টাস্ক ম্যানেজার
              </AppText>
            </View>
            <AppText weight="bold" style={styles.mainTitle}>
              আমার অ্যাসাইনকৃত কাজসমূহ
            </AppText>
          </View>

          <TouchableOpacity
            onPress={() => {
              setRefreshing(true);
              fetchAssignedTasks();
            }}
            style={styles.refreshIconButton}
            activeOpacity={0.7}
          >
            <RefreshCw size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Progress Card Banner */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeaderRow}>
            <View style={styles.progressLeft}>
              <TrendingUp size={16} color="#4ade80" />
              <AppText weight="semibold" style={styles.progressLabel}>
                টাস্ক সম্পন্ন করার অগ্রগতি
              </AppText>
            </View>
            <AppText weight="bold" style={styles.progressPctText}>
              {progressPct}%
            </AppText>
          </View>

          {/* Progress Bar Track */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>

          {/* Metrics Row */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <AppText weight="bold" style={styles.metricValue}>
                {totalCount}
              </AppText>
              <AppText style={styles.metricLabel}>মোট টাস্ক</AppText>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <AppText weight="bold" style={[styles.metricValue, { color: "#facc15" }]}>
                {pendingCount}
              </AppText>
              <AppText style={styles.metricLabel}>চলতি কাজ</AppText>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <AppText weight="bold" style={[styles.metricValue, { color: "#4ade80" }]}>
                {completedCount}
              </AppText>
              <AppText style={styles.metricLabel}>সম্পন্ন</AppText>
            </View>

            {highPriorityCount > 0 ? (
              <>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <AppText weight="bold" style={[styles.metricValue, { color: "#f87171" }]}>
                    {highPriorityCount}
                  </AppText>
                  <AppText style={styles.metricLabel}>জরুরি</AppText>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </LinearGradient>

      {/* ── Search & Filters Toolbar ── */}
      <View style={styles.toolbarContainer}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color="#94a3b8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="খুঁজুন (টাস্ক শিরোনাম বা বিবরণ)..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")} p-1>
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Status Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <TouchableOpacity
            onPress={() => setStatusFilter("ALL")}
            style={[styles.filterChip, statusFilter === "ALL" && styles.filterChipActive]}
          >
            <AppText
              weight="semibold"
              style={[styles.filterChipText, statusFilter === "ALL" && styles.filterChipTextActive]}
            >
              সব ({totalCount})
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setStatusFilter("PENDING")}
            style={[styles.filterChip, statusFilter === "PENDING" && styles.filterChipActive]}
          >
            <AppText
              weight="semibold"
              style={[styles.filterChipText, statusFilter === "PENDING" && styles.filterChipTextActive]}
            >
              চলতি ({pendingCount})
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setStatusFilter("COMPLETED")}
            style={[styles.filterChip, statusFilter === "COMPLETED" && styles.filterChipActive]}
          >
            <AppText
              weight="semibold"
              style={[styles.filterChipText, statusFilter === "COMPLETED" && styles.filterChipTextActive]}
            >
              সম্পন্ন ({completedCount})
            </AppText>
          </TouchableOpacity>

          {/* Priority Quick Filter */}
          <View style={styles.chipDivider} />

          <TouchableOpacity
            onPress={() => setPriorityFilter(priorityFilter === "HIGH" ? "ALL" : "HIGH")}
            style={[
              styles.priorityChip,
              priorityFilter === "HIGH" && styles.priorityChipHighActive,
            ]}
          >
            <AlertTriangle
              size={12}
              color={priorityFilter === "HIGH" ? "#ffffff" : "#ef4444"}
            />
            <AppText
              weight="semibold"
              style={[
                styles.priorityChipText,
                priorityFilter === "HIGH" && styles.priorityChipTextActive,
              ]}
            >
              জরুরি
            </AppText>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── Main Task List ── */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#166534" />
          <AppText style={styles.loadingText}>টাস্ক লোড হচ্ছে...</AppText>
        </View>
      ) : filteredTasks.length === 0 ? (
        <View style={styles.centerBox}>
          <CheckSquare size={48} color="#cbd5e1" />
          <AppText weight="bold" style={styles.emptyTitle}>
            {searchQuery || statusFilter !== "ALL"
              ? "ফিল্টারে কোনো কাজ পাওয়া যায়নি"
              : "কোনো টাস্ক খালি নেই"}
          </AppText>
          <AppText style={styles.emptySub}>
            {searchQuery || statusFilter !== "ALL"
              ? "অন্য কোনো সার্চ কি-ওয়ার্ড বা ফিল্টার ট্রাই করুন।"
              : "অ্যাডমিন পোর্টাল থেকে নতুন কাজ বরাদ্দ করা হলে তা রিয়েল-টাইমে এখানে চলে আসবে।"}
          </AppText>
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.assignment_id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchAssignedTasks();
              }}
              colors={[COLORS.success]}
            />
          }
          renderItem={({ item }) => {
            const isCompleted = item.status === "COMPLETED";
            const isHighPriority = item.priority === "HIGH";

            return (
              <Pressable
                onPress={() => toggleTaskStatus(item)}
                style={({ pressed }) => [
                  styles.taskCard,
                  isCompleted && styles.taskCardCompleted,
                  isHighPriority && !isCompleted && styles.taskCardHighPriority,
                  pressed && styles.taskCardPressed,
                ]}
              >
                {/* Header Row: Checkbox, Title, Priority Badge */}
                <View style={styles.cardHeader}>
                  <TouchableOpacity
                    onPress={() => toggleTaskStatus(item)}
                    style={styles.checkboxTouch}
                    activeOpacity={0.7}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={24} color="#166534" />
                    ) : (
                      <Circle size={24} color={isHighPriority ? "#ef4444" : "#94a3b8"} />
                    )}
                  </TouchableOpacity>

                  <View style={styles.titleWrapper}>
                    <AppText
                      weight="bold"
                      style={[styles.taskTitleText, isCompleted && styles.taskTitleCompleted]}
                    >
                      {item.title}
                    </AppText>

                    {item.description ? (
                      <AppText
                        style={[styles.taskDescText, isCompleted && styles.taskDescCompleted]}
                        numberOfLines={2}
                      >
                        {item.description}
                      </AppText>
                    ) : null}
                  </View>

                  <Badge
                    tone={
                      isCompleted
                        ? "success"
                        : isHighPriority
                        ? "danger"
                        : item.priority === "MEDIUM"
                        ? "warning"
                        : "neutral"
                    }
                    label={
                      isCompleted
                        ? "সম্পন্ন"
                        : isHighPriority
                        ? "জরুরি"
                        : item.priority === "MEDIUM"
                        ? "মাঝারি"
                        : "সাধারণ"
                    }
                  />

                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push({ pathname: "/task/[id]", params: { id: item.assignment_id } });
                    }}
                    style={styles.detailsButton}
                    hitSlop={8}
                  >
                    <Info size={16} color="#64748b" />
                  </TouchableOpacity>
                </View>

                {/* Footer Metadata Row */}
                <View style={styles.cardFooter}>
                  <View style={styles.footerLeft}>
                    {item.due_date ? (
                      <View style={styles.metaPill}>
                        <Calendar size={12} color="#64748b" />
                        <AppText style={styles.metaText}>
                          মেয়াদ: {new Date(item.due_date).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US")}
                        </AppText>
                      </View>
                    ) : null}

                    {isCompleted && item.completed_at ? (
                      <View style={[styles.metaPill, styles.completedMetaPill]}>
                        <Clock size={12} color="#15803d" />
                        <AppText style={styles.completedMetaText}>
                          সম্পন্ন: {new Date(item.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </AppText>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.actionPrompt}>
                    <AppText weight="semibold" style={styles.actionPromptText}>
                      {isCompleted ? "পুনরায় চালু করুন" : "সম্পন্ন করতে ট্যাপ করুন"}
                    </AppText>
                    <ChevronRight size={14} color={isCompleted ? "#64748b" : "#15803d"} />
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  heroGradient: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  brandBadgeText: {
    fontSize: 11,
    color: "#86efac",
    letterSpacing: 0.3,
  },
  mainTitle: {
    fontSize: 22,
    color: "#FFFFFF",
  },
  refreshIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  progressCard: {
    marginTop: 18,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  progressHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  progressLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: "#E2E8F0",
  },
  progressPctText: {
    fontSize: 18,
    color: "#4ade80",
  },
  progressTrack: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 14,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4ade80",
    borderRadius: 4,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  metricItem: {
    alignItems: "center",
  },
  metricValue: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  metricLabel: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  toolbarContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.canvas,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: "#0F172A",
  },
  filterScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterChipActive: {
    backgroundColor: "#166534",
    borderColor: "#166534",
  },
  filterChipText: {
    fontSize: 12,
    color: "#64748B",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  chipDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#CBD5E1",
    marginHorizontal: 2,
  },
  priorityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  priorityChipHighActive: {
    backgroundColor: "#EF4444",
    borderColor: "#EF4444",
  },
  priorityChipText: {
    fontSize: 12,
    color: "#EF4444",
  },
  priorityChipTextActive: {
    color: "#FFFFFF",
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },
  emptyTitle: {
    fontSize: 16,
    color: "#334155",
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  listContent: {
    padding: 16,
    paddingBottom: 110,
  },
  taskCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  taskCardHighPriority: {
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  taskCardCompleted: {
    backgroundColor: COLORS.canvas,
    borderColor: "#E2E8F0",
    opacity: 0.88,
  },
  taskCardPressed: {
    transform: [{ scale: 0.985 }],
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkboxTouch: {
    marginTop: 2,
    padding: 2,
  },
  detailsButton: {
    marginTop: 2,
    padding: 4,
  },
  titleWrapper: {
    flex: 1,
  },
  taskTitleText: {
    fontSize: 15,
    color: "#0F172A",
    lineHeight: 22,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#64748B",
  },
  taskDescText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    lineHeight: 18,
  },
  taskDescCompleted: {
    color: "#94A3B8",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 11,
    color: "#475569",
  },
  completedMetaPill: {
    backgroundColor: "#DCFCE7",
  },
  completedMetaText: {
    fontSize: 11,
    color: "#15803d",
    fontWeight: "600",
  },
  actionPrompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  actionPromptText: {
    fontSize: 11,
    color: "#166534",
  },
});

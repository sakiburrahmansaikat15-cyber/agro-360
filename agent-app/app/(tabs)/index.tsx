import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import {
  ArrowUpRight,
  Bell,
  ChevronRight,
  ClipboardList,
  MapPin,
  QrCode,
  RefreshCw,
  Sprout,
  Users,
  UserPlus,
  Wheat,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Scan,
  Sparkles,
  TrendingUp,
  Activity,
  X,
  FileText,
} from "lucide-react-native";

import { AppText } from "@/components/ui/AppText";
import { Extruded } from "@/components/ui/Extruded";
import { GradientTile } from "@/components/ui/GradientTile";
import { IsoField } from "@/components/ui/IsoField";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { useLanguage, useT } from "@/lib/i18n/context";
import { useUser } from "@/lib/context/UserContext";
import { supabase } from "@/lib/supabase";
import { getPendingCount } from "@/lib/hooks/useSyncQueue";
import { HERO_GRADIENT, COLORS } from "@/constants/theme";

function useGreetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return "greeting_morning";
  if (hour < 17) return "greeting_day";
  return "greeting_evening";
}

export default function HomeScreen() {
  const t = useT();
  const { locale, toggleLocale } = useLanguage();
  const router = useRouter();
  const greetingKey = useGreetingKey();
  const { name, profilePicture, region, user, agent } = useUser();

  // Real-time State from Supabase
  const [farmerCount, setFarmerCount] = useState<number>(0);
  const [batchCount, setBatchCount] = useState<number>(0);
  const [taskCount, setTaskCount] = useState<number>(0);
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Surfaces whether any farmer/batch registered while offline is still
  // waiting to sync (see lib/hooks/useSyncQueue.ts, which is what actually
  // performs the retry from the tabs layout). Previously there was no
  // offline indicator anywhere in the app despite the login screen
  // advertising offline support.
  useEffect(() => {
    let mounted = true;
    const check = () => getPendingCount().then((n) => mounted && setPendingSyncCount(n));
    check();
    const interval = setInterval(check, 10_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const fetchLiveHomeData = async () => {
    if (!supabase) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // 1. Registered Farmers count & recent activities
      const { data: farmersData, count: fCount } = await supabase
        .from("farmers")
        .select("*", { count: "exact" })
        .order("synced_at", { ascending: false })
        .limit(3);

      // 2. Batches count & recent activities
      const { data: batchesData, count: bCount } = await supabase
        .from("batches")
        .select("*", { count: "exact" })
        .order("synced_at", { ascending: false })
        .limit(3);

      setFarmerCount(fCount || 0);
      setBatchCount(bCount || 0);

      // Combine recent activities
      const activities: any[] = [];
      (farmersData || []).forEach((f: any) => {
        activities.push({
          id: `farmer-${f.id}`,
          type: "FARMER",
          title: `নতুন কৃষক নিবন্ধিত: ${f.name}`,
          subtitle: `${f.village || "গ্রাম"} · ${f.crop || "ধান"}`,
          time: f.synced_at,
        });
      });

      (batchesData || []).forEach((b: any) => {
        activities.push({
          id: `batch-${b.id}`,
          type: "BATCH",
          title: `ফসল ব্যাচ তৈরি: ${b.id}`,
          subtitle: `${b.farmerName} · ${b.quantityKg} কেজি`,
          time: b.synced_at,
        });
      });

      activities.sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());
      setRecentActivities(activities.slice(0, 4));

      // 3. Assigned Tasks for logged in agent
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

      if (agentDbId) {
        const { data: tasksData, count: tCount } = await supabase
          .from("task_assignments")
          .select("id, status, completed_at, tasks(id, title, description, priority, due_date)", { count: "exact" })
          .eq("agent_id", agentDbId)
          .order("id", { ascending: false });

        setTaskCount(tCount || 0);

        if (tasksData) {
          const pendingTasks = tasksData
            .filter((item: any) => item.status !== "COMPLETED")
            .map((item: any) => ({
              id: item.id,
              title: item.tasks?.title || "অ্যাসাইনকৃত টাস্ক",
              description: item.tasks?.description || "",
              priority: item.tasks?.priority || "NORMAL",
              due_date: item.tasks?.due_date,
            }));
          setAssignedTasks(pendingTasks);
        }
      }
    } catch (err) {
      console.error("Home live data error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveHomeData();

    // Supabase Realtime Channel Listener
    if (supabase) {
      const channel = supabase
        .channel("realtime_home_dashboard")
        .on("postgres_changes", { event: "*", schema: "public", table: "farmers" }, fetchLiveHomeData)
        .on("postgres_changes", { event: "*", schema: "public", table: "batches" }, fetchLiveHomeData)
        .on("postgres_changes", { event: "*", schema: "public", table: "task_assignments" }, fetchLiveHomeData)
        .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, fetchLiveHomeData)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, agent]);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchLiveHomeData();
            }}
            colors={[COLORS.success]}
          />
        }
      >
        <View style={styles.contentWrapper}>
          {/* ── Premium Gradient Hero Banner ── */}
          <LinearGradient
            colors={HERO_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <SafeAreaView edges={["top"]}>
              {/* Top Bar Header */}
              <View style={styles.headerRow}>
                <View style={styles.userProfileGroup}>
                  <View style={styles.avatarCircle}>
                    {profilePicture ? (
                      <Image
                        source={{ uri: profilePicture }}
                        style={styles.avatarImg}
                        contentFit="cover"
                      />
                    ) : (
                      <AppText weight="bold" style={styles.avatarText}>
                        {name.charAt(0).toUpperCase()}
                      </AppText>
                    )}
                  </View>
                  <View>
                    <AppText style={styles.greetingText}>
                      {t(`home.${greetingKey}`)} 👋
                    </AppText>
                    <AppText weight="bold" style={styles.nameText}>
                      {name}
                    </AppText>
                  </View>
                </View>

                {/* Right Action Icons */}
                <View style={styles.headerActions}>
                  <TouchableOpacity
                    onPress={toggleLocale}
                    style={styles.langBtn}
                    activeOpacity={0.7}
                  >
                    <AppText weight="bold" style={styles.langBtnText}>
                      {locale === "bn" ? "বাংলা" : "EN"}
                    </AppText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowNotifications(true)}
                    style={styles.bellBtn}
                    activeOpacity={0.7}
                  >
                    <Bell size={18} color="#ffffff" />
                    {assignedTasks.length > 0 ? (
                      <View style={styles.bellBadgeDot} />
                    ) : null}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Season & Region Status Card */}
              <View style={styles.seasonCard}>
                <View style={styles.seasonContent}>
                  <View style={styles.seasonLeft}>
                    <View style={styles.seasonIconBox}>
                      <Wheat size={24} color="#78350f" />
                    </View>
                    <View style={styles.seasonDetails}>
                      <AppText weight="bold" style={styles.seasonTitle}>
                        {t("home.season")}
                      </AppText>
                      <View style={styles.regionPill}>
                        <MapPin size={11} color="#bbf7d0" />
                        <AppText weight="semibold" style={styles.regionText}>
                          {region || "বগুড়া সদর, বগুড়া"}
                        </AppText>
                      </View>
                    </View>
                  </View>

                  <IsoField />
                </View>

                {/* Divider */}
                <View style={styles.seasonDivider} />

                {/* Live Sync Status Footer */}
                <View style={styles.syncFooter}>
                  <View style={styles.syncFooterLeft}>
                    <View style={pendingSyncCount > 0 ? styles.pendingAmberDot : styles.liveGreenDot} />
                    <AppText weight="semibold" style={styles.syncStatusText}>
                      {pendingSyncCount > 0
                        ? `${pendingSyncCount}টি এন্ট্রি সিঙ্কের অপেক্ষায় আছে`
                        : "রিয়েল-টাইম ডাটাবেজ সিঙ্কড (Supabase Live)"}
                    </AppText>
                  </View>

                  <Badge
                    tone={pendingSyncCount > 0 ? "warning" : "success"}
                    label={pendingSyncCount > 0 ? "অপেক্ষমাণ" : "সক্রিয়"}
                  />
                </View>
              </View>
            </SafeAreaView>
          </LinearGradient>

          {/* ── 3D Extruded Live Statistics Bar ── */}
          <View style={styles.statsOverlapRow}>
            <StatCard
              icon={<Users size={16} color="#ffffff" />}
              value={String(farmerCount)}
              label={t("home.stat_farmers")}
              tone="brand"
            />
            <StatCard
              icon={<QrCode size={16} color="#ffffff" />}
              value={String(batchCount)}
              label={t("home.stat_batches")}
              tone="teal"
            />
            <StatCard
              icon={<ClipboardList size={16} color="#ffffff" />}
              value={String(assignedTasks.length)}
              label="চলতি টাস্ক"
              tone="honey"
            />
          </View>

          {/* ── Quick Actions Grid ── */}
          <View style={styles.sectionContainer}>
            <SectionHeader
              icon={<Sprout size={16} color="#15803d" />}
              title={t("home.section_quick")}
            />

            <View style={styles.actionsGrid}>
              {/* Register Farmer */}
              <Extruded
                onPress={() => router.push("/farmer/new")}
                depth={5}
                radius={20}
                baseColor="#bbf7d0"
                faceColor="#ffffff"
                style={{ flex: 1 }}
              >
                <View style={styles.actionCardInner}>
                  <View style={styles.actionHeader}>
                    <GradientTile preset="green" size="md">
                      <UserPlus size={20} color="#ffffff" />
                    </GradientTile>
                    <View style={styles.actionArrowCircle}>
                      <ArrowUpRight size={14} color="#15803d" />
                    </View>
                  </View>
                  <AppText weight="bold" style={styles.actionTitle}>
                    {t("home.action_register_farmer")}
                  </AppText>
                  <AppText style={styles.actionSub}>
                    কৃষকের তথ্য নিবন্ধন
                  </AppText>
                </View>
              </Extruded>

              {/* New Crop Batch */}
              <Extruded
                onPress={() => router.push("/batch/new")}
                depth={5}
                radius={20}
                baseColor="#fef3c7"
                faceColor="#ffffff"
                style={{ flex: 1 }}
              >
                <View style={styles.actionCardInner}>
                  <View style={styles.actionHeader}>
                    <GradientTile preset="honey" size="md">
                      <QrCode size={20} color="#ffffff" />
                    </GradientTile>
                    <View style={styles.actionArrowCircleAmber}>
                      <ArrowUpRight size={14} color="#d97706" />
                    </View>
                  </View>
                  <AppText weight="bold" style={styles.actionTitle}>
                    {t("home.action_new_batch")}
                  </AppText>
                  <AppText style={styles.actionSub}>
                    QR ট্যাগ তৈরি
                  </AppText>
                </View>
              </Extruded>
            </View>

            <View style={[styles.actionsGrid, { marginTop: 12 }]}>
              {/* Quick Scan */}
              <TouchableOpacity
                onPress={() => router.push("/scan")}
                style={styles.quickActionFlatBtn}
                activeOpacity={0.8}
              >
                <View style={[styles.flatIconBox, { backgroundColor: "#F0FDF4" }]}>
                  <Scan size={18} color="#166534" />
                </View>
                <AppText weight="semibold" style={styles.flatBtnText}>
                  QR কোড স্ক্যান
                </AppText>
              </TouchableOpacity>

              {/* My Tasks */}
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/tasks")}
                style={styles.quickActionFlatBtn}
                activeOpacity={0.8}
              >
                <View style={[styles.flatIconBox, { backgroundColor: "#FEF3C7" }]}>
                  <ClipboardList size={18} color="#b45309" />
                </View>
                <AppText weight="semibold" style={styles.flatBtnText}>
                  টাস্ক লিস্ট ({assignedTasks.length})
                </AppText>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Assigned Tasks List Widget ── */}
          <View style={styles.sectionContainer}>
            <SectionHeader
              icon={<ClipboardList size={16} color="#15803d" />}
              title={t("home.tasks_title")}
              trailing={
                <TouchableOpacity onPress={() => router.push("/(tabs)/tasks")}>
                  <AppText weight="bold" style={styles.viewAllText}>
                    সব দেখুন ({assignedTasks.length}) →
                  </AppText>
                </TouchableOpacity>
              }
            />

            <View style={styles.tasksWidgetCard}>
              {loading ? (
                <View style={styles.widgetCenterBox}>
                  <ActivityIndicator size="small" color="#166534" />
                </View>
              ) : assignedTasks.length === 0 ? (
                <View style={styles.widgetCenterBox}>
                  <CheckCircle2 size={24} color="#86efac" />
                  <AppText style={styles.emptyTasksText}>
                    সব টাস্ক সম্পন্ন হয়েছে! কোনো অপেক্ষমাণ কাজ নেই।
                  </AppText>
                </View>
              ) : (
                assignedTasks.slice(0, 3).map((task, i) => (
                  <Pressable
                    key={task.id}
                    onPress={() => router.push("/(tabs)/tasks")}
                    style={[
                      styles.taskItemRow,
                      i !== Math.min(assignedTasks.length, 3) - 1 && styles.taskItemDivider,
                    ]}
                  >
                    <View style={styles.taskIconCircle}>
                      <ClipboardList size={16} color="#166534" />
                    </View>
                    <View style={styles.taskTextWrapper}>
                      <AppText weight="bold" style={styles.taskTitle}>
                        {task.title}
                      </AppText>
                      {task.description ? (
                        <AppText style={styles.taskDesc} numberOfLines={1}>
                          {task.description}
                        </AppText>
                      ) : null}
                    </View>
                    <Badge
                      tone={task.priority === "HIGH" ? "danger" : "neutral"}
                      label={task.priority === "HIGH" ? "জরুরি" : "সাধারণ"}
                    />
                    <ChevronRight size={16} color="#cbd5e1" />
                  </Pressable>
                ))
              )}
            </View>
          </View>

          {/* ── Recent Activity Stream Widget ── */}
          <View style={styles.sectionContainer}>
            <SectionHeader
              icon={<Activity size={16} color="#15803d" />}
              title="সাম্প্রতিক ফিল্ড কার্যক্রম (Live Feed)"
            />

            <View style={styles.activityCard}>
              {recentActivities.length === 0 ? (
                <View style={styles.widgetCenterBox}>
                  <AppText style={styles.emptyTasksText}>
                    কোনো সাম্প্রতিক ফিল্ড কার্যক্রম পাওয়া যায়নি।
                  </AppText>
                </View>
              ) : (
                recentActivities.map((act, idx) => (
                  <View
                    key={act.id}
                    style={[
                      styles.activityRow,
                      idx !== recentActivities.length - 1 && styles.taskItemDivider,
                    ]}
                  >
                    <View
                      style={[
                        styles.activityIconCircle,
                        { backgroundColor: act.type === "FARMER" ? "#F0FDF4" : "#FEF3C7" },
                      ]}
                    >
                      {act.type === "FARMER" ? (
                        <UserPlus size={14} color="#166534" />
                      ) : (
                        <QrCode size={14} color="#d97706" />
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <AppText weight="semibold" style={styles.activityTitle}>
                        {act.title}
                      </AppText>
                      <AppText style={styles.activitySub}>{act.subtitle}</AppText>
                    </View>

                    <AppText style={styles.activityTime}>
                      {act.time ? new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "এখনই"}
                    </AppText>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Notification Modal Drawer ── */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleGroup}>
                <Bell size={18} color="#166534" />
                <AppText weight="bold" style={styles.modalTitleText}>
                  বিজ্ঞপ্তি ও বার্তা (Notifications)
                </AppText>
              </View>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {assignedTasks.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <CheckCircle2 size={32} color="#86efac" />
                  <AppText style={styles.modalEmptyText}>কোনো নতুন বিজ্ঞপ্তি নেই</AppText>
                </View>
              ) : (
                assignedTasks.map((t) => (
                  <View key={t.id} style={styles.notifItem}>
                    <View style={styles.notifIconCircle}>
                      <FileText size={16} color="#166534" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText weight="bold" style={styles.notifTitle}>
                        নতুন টাস্ক বরাদ্দ করা হয়েছে
                      </AppText>
                      <AppText style={styles.notifSub}>{t.title}</AppText>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  scrollContent: {
    paddingBottom: 110,
    alignItems: "center",
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 768,
  },
  heroGradient: {
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 70,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  userProfileGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  greetingText: {
    fontSize: 11,
    color: "#86efac",
  },
  nameText: {
    fontSize: 17,
    color: "#FFFFFF",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  langBtnText: {
    fontSize: 11,
    color: "#FFFFFF",
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    position: "relative",
  },
  bellBadgeDot: {
    position: "absolute",
    top: 6,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
    borderWidth: 1,
    borderColor: "#0b1f13",
  },
  seasonCard: {
    marginTop: 18,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    padding: 16,
  },
  seasonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  seasonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  seasonIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  seasonDetails: {
    flex: 1,
  },
  seasonTitle: {
    fontSize: 15,
    color: "#FFFFFF",
  },
  regionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  regionText: {
    fontSize: 11,
    color: "#bbf7d0",
  },
  seasonDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginVertical: 12,
  },
  syncFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  syncFooterLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ade80",
  },
  pendingAmberDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#facc15",
  },
  syncStatusText: {
    fontSize: 11,
    color: "#E2E8F0",
  },
  statsOverlapRow: {
    marginTop: -42,
    paddingHorizontal: 20,
    flexDirection: "row",
    gap: 10,
  },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  actionsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  actionCardInner: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: 20,
    height: "100%",
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  actionArrowCircleAmber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: {
    fontSize: 14,
    color: "#0F172A",
    marginTop: 14,
  },
  actionSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  quickActionFlatBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  flatIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  flatBtnText: {
    fontSize: 12,
    color: "#0F172A",
  },
  viewAllText: {
    fontSize: 12,
    color: "#166534",
  },
  tasksWidgetCard: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  widgetCenterBox: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTasksText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 6,
    textAlign: "center",
  },
  taskItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  taskItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  taskIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  taskTextWrapper: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    color: "#0F172A",
  },
  taskDesc: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  activityCard: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  activityIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  activityTitle: {
    fontSize: 13,
    color: "#0F172A",
  },
  activitySub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  activityTime: {
    fontSize: 11,
    color: "#94A3B8",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: "75%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitleText: {
    fontSize: 16,
    color: "#0F172A",
  },
  modalBody: {
    paddingTop: 14,
  },
  modalEmpty: {
    alignItems: "center",
    padding: 30,
  },
  modalEmptyText: {
    marginTop: 8,
    fontSize: 13,
    color: "#64748B",
  },
  notifItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  notifIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  notifTitle: {
    fontSize: 14,
    color: "#0F172A",
  },
  notifSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
});

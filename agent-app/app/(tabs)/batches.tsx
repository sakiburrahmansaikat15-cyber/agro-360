import { useRouter } from "expo-router";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Package,
  Plus,
  QrCode,
  RefreshCw,
  Scan,
  Search,
  Sprout,
  User,
  Weight,
  X,
  ShieldCheck,
  Calendar,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  TextInput,
  View,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { AnimatedPressCard } from "@/components/ui/AnimatedPressCard";
import { AppText } from "@/components/ui/AppText";
import { HERO_GRADIENT, COLORS } from "@/constants/theme";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLanguage, useT } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase";

export type BatchRecord = {
  id: string;
  farmerId: string;
  farmerName: string;
  crop: string;
  quantityKg: number;
  harvestDate: string;
  inputs: string[];
  status: string;
  synced_at?: string;
};

type FilterTab = "all" | "tagged" | "pending";

export default function BatchesScreen() {
  const t = useT();
  const { locale } = useLanguage();
  const router = useRouter();

  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const fetchLiveBatches = async () => {
    if (!supabase) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("batches")
        .select("*")
        .order("synced_at", { ascending: false });

      if (error) {
        console.error("Error loading batches from Supabase:", error);
      } else if (data) {
        const formatted: BatchRecord[] = data.map((b: any) => ({
          id: b.id,
          farmerId: b.farmer_id || "",
          farmerName: b.farmerName || "কৃষক",
          crop: b.crop || "ধান",
          quantityKg: Number(b.quantityKg) || 0,
          harvestDate: b.harvestDate || "",
          inputs: Array.isArray(b.inputs) ? b.inputs : typeof b.inputs === "string" ? JSON.parse(b.inputs || "[]") : [],
          status: b.status || "TAGGED",
          synced_at: b.synced_at,
        }));
        setBatches(formatted);
      }
    } catch (err) {
      console.error("Live batches fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveBatches();

    // Supabase Realtime Listener for instant synchronization
    if (supabase) {
      const channel = supabase
        .channel("realtime_batches_tab")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "batches" },
          () => fetchLiveBatches()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  // Filter Counts & Metrics
  const totalCount = batches.length;
  const taggedCount = batches.filter((b) => b.status === "TAGGED" || b.status === "SYNCED").length;
  const pendingCount = totalCount - taggedCount;
  const totalQuantityKg = batches.reduce((sum, b) => sum + (b.quantityKg || 0), 0);

  // Filtered List
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const q = query.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.id.toLowerCase().includes(q) ||
        b.farmerName.toLowerCase().includes(q) ||
        b.crop.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      const isTagged = b.status === "TAGGED" || b.status === "SYNCED";
      if (activeTab === "tagged") return isTagged;
      if (activeTab === "pending") return !isTagged;
      return true;
    });
  }, [query, batches, activeTab]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* ── Premium Gradient Hero Header ── */}
      <LinearGradient
        colors={HERO_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        <View style={styles.topRow}>
          <View>
            <View style={styles.brandBadge}>
              <ShieldCheck size={12} color="#86efac" />
              <AppText weight="bold" style={styles.brandBadgeText}>
                DAE স্মার্ট ট্রেসেবিলিটি
              </AppText>
            </View>
            <AppText weight="bold" style={styles.mainTitle}>
              {t("batches.title")}
            </AppText>
          </View>

          <View style={styles.headerBtnGroup}>
            <TouchableOpacity
              onPress={() => router.push("/scan")}
              style={styles.scanBtn}
              activeOpacity={0.8}
            >
              <Scan size={18} color="#15803d" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/batch/new")}
              style={styles.addBatchBtn}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#ffffff" strokeWidth={3} />
              <AppText weight="bold" style={styles.addBatchBtnText}>
                {locale === "bn" ? "নতুন ব্যাচ" : "New Batch"}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Metrics Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <AppText weight="bold" style={styles.statValue}>
              {totalCount}
            </AppText>
            <AppText style={styles.statLabel}>মোট ব্যাচ</AppText>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <AppText weight="bold" style={[styles.statValue, { color: "#4ade80" }]}>
              {(totalQuantityKg / 1000).toFixed(1)} MT
            </AppText>
            <AppText style={styles.statLabel}>মোট পরিমাণ</AppText>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <AppText weight="bold" style={[styles.statValue, { color: "#86efac" }]}>
              {taggedCount}
            </AppText>
            <AppText style={styles.statLabel}>QR ট্যাগকৃত</AppText>
          </View>
        </View>
      </LinearGradient>

      {/* ── Search & Filters Toolbar ── */}
      <View style={styles.toolbarContainer}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color="#94a3b8" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("batches.search_placeholder")}
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery("")} p-1>
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            onPress={() => setActiveTab("all")}
            style={[styles.tabChip, activeTab === "all" && styles.tabChipActive]}
          >
            <AppText
              weight="semibold"
              style={[styles.tabChipText, activeTab === "all" && styles.tabChipTextActive]}
            >
              {locale === "bn" ? "সব ব্যাচ" : "All"} ({totalCount})
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("tagged")}
            style={[styles.tabChip, activeTab === "tagged" && styles.tabChipActive]}
          >
            <CheckCircle2 size={13} color={activeTab === "tagged" ? "#ffffff" : "#166534"} />
            <AppText
              weight="semibold"
              style={[styles.tabChipText, activeTab === "tagged" && styles.tabChipTextActive]}
            >
              QR ট্যাগকৃত ({taggedCount})
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("pending")}
            style={[styles.tabChip, activeTab === "pending" && styles.tabChipActive]}
          >
            <Clock size={13} color={activeTab === "pending" ? "#ffffff" : "#b45309"} />
            <AppText
              weight="semibold"
              style={[styles.tabChipText, activeTab === "pending" && styles.tabChipTextActive]}
            >
              অপেক্ষমাণ ({pendingCount})
            </AppText>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Batches List ── */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#166534" />
          <AppText style={styles.loadingText}>ব্যাচ তালিকা লোড হচ্ছে...</AppText>
        </View>
      ) : filteredBatches.length === 0 ? (
        <View style={styles.centerBox}>
          <EmptyState
            icon={<QrCode size={36} color="#166534" />}
            title={
              query || activeTab !== "all"
                ? "কোনো ব্যাচ মিল পাওয়া যায়নি"
                : t("batches.empty_title")
            }
            subtitle={
              query || activeTab !== "all"
                ? "অন্য সার্চ কি-ওয়ার্ড চেষ্টা করুন।"
                : t("batches.empty_subtitle")
            }
          />
          <View style={{ marginTop: 16 }}>
            <Button onPress={() => router.push("/batch/new")}>
              {t("batches.add_button")}
            </Button>
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredBatches}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchLiveBatches();
              }}
              colors={[COLORS.success]}
            />
          }
          renderItem={({ item }) => {
            const isTagged = item.status === "TAGGED" || item.status === "SYNCED";
            return (
              <AnimatedPressCard
                onPress={() =>
                  router.push({ pathname: "/batch/[id]", params: { id: item.id } })
                }
                style={styles.batchCard}
              >
                <View style={styles.cardHeaderRow}>
                  {/* QR Box */}
                  <View style={styles.qrBox}>
                    <QrCode size={24} color="#166534" />
                  </View>

                  <View style={styles.cardMainDetails}>
                    <View style={styles.titleRow}>
                      <AppText weight="bold" style={styles.batchIdText}>
                        {item.id}
                      </AppText>
                      <Badge
                        tone={isTagged ? "success" : "warning"}
                        label={isTagged ? "QR ট্যাগকৃত" : "অপেক্ষমাণ"}
                      />
                    </View>

                    {/* Metadata Row */}
                    <View style={styles.metaRow}>
                      <View style={styles.pill}>
                        <User size={11} color="#64748b" />
                        <AppText style={styles.pillText}>{item.farmerName}</AppText>
                      </View>

                      <View style={[styles.pill, styles.cropPill]}>
                        <Sprout size={11} color="#166534" />
                        <AppText weight="semibold" style={styles.cropPillText}>
                          {item.crop}
                        </AppText>
                      </View>

                      {item.quantityKg ? (
                        <View style={styles.pill}>
                          <Weight size={11} color="#64748b" />
                          <AppText style={styles.pillText}>
                            {item.quantityKg} কেজি
                          </AppText>
                        </View>
                      ) : null}
                    </View>

                    {/* Inputs Chips */}
                    {item.inputs && item.inputs.length > 0 ? (
                      <View style={styles.inputsRow}>
                        {item.inputs.slice(0, 3).map((inp) => (
                          <View key={inp} style={styles.inputChip}>
                            <AppText style={styles.inputChipText}>{inp}</AppText>
                          </View>
                        ))}
                        {item.inputs.length > 3 && (
                          <AppText style={styles.moreInputsText}>
                            +{item.inputs.length - 3} আরও
                          </AppText>
                        )}
                      </View>
                    ) : null}
                  </View>

                  <ChevronRight size={18} color="#94a3b8" />
                </View>
              </AnimatedPressCard>
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
    paddingBottom: 20,
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
  },
  mainTitle: {
    fontSize: 22,
    color: "#FFFFFF",
  },
  headerBtnGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scanBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addBatchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addBatchBtnText: {
    fontSize: 13,
    color: "#FFFFFF",
  },
  statsCard: {
    marginTop: 16,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  toolbarContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
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
  tabsRow: {
    flexDirection: "row",
    gap: 8,
  },
  tabChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabChipActive: {
    backgroundColor: "#166534",
    borderColor: "#166534",
  },
  tabChipText: {
    fontSize: 12,
    color: "#64748B",
  },
  tabChipTextActive: {
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
  listContent: {
    padding: 16,
    paddingBottom: 110,
  },
  batchCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qrBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  cardMainDetails: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  batchIdText: {
    fontSize: 14,
    color: "#0F172A",
    fontFamily: "monospace",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 11,
    color: "#475569",
  },
  cropPill: {
    backgroundColor: "#F0FDF4",
    borderColor: "#DCFCE7",
    borderWidth: 1,
  },
  cropPillText: {
    fontSize: 11,
    color: "#166534",
  },
  inputsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 6,
  },
  inputChip: {
    backgroundColor: COLORS.canvas,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inputChipText: {
    fontSize: 10,
    color: "#64748B",
  },
  moreInputsText: {
    fontSize: 10,
    color: "#94A3B8",
    alignSelf: "center",
  },
});

import { useRouter } from "expo-router";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Sprout,
  UserRoundPlus,
  Users,
  X,
  ShieldCheck,
  TrendingUp,
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
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLanguage, useT } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase";

export type FarmerRecord = {
  id: string;
  name: string;
  phone: string;
  village: string;
  union_name: string;
  landDecimal: number;
  crop: string;
  status: string;
  synced_at?: string;
  hasWallet?: boolean;
};

type FilterTab = "all" | "approved" | "pending";

export default function FarmersScreen() {
  const t = useT();
  const { locale } = useLanguage();
  const router = useRouter();

  const [farmers, setFarmers] = useState<FarmerRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const fetchLiveFarmers = async () => {
    if (!supabase) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("farmers")
        .select("*")
        .order("synced_at", { ascending: false });

      if (error) {
        console.error("Error loading farmers from Supabase:", error);
      } else if (data) {
        const formatted: FarmerRecord[] = data.map((f: any) => ({
          id: f.id,
          name: f.name || "কৃষক",
          phone: f.phone || f.phone_number || "-",
          village: f.village || "গ্রাম",
          union_name: f.union_name || "ইউনিয়ন",
          landDecimal: Number(f.landDecimal) || 0,
          crop: f.crop || "ধান",
          status: f.status || "APPROVED",
          synced_at: f.synced_at,
          hasWallet: !!f.hasWallet,
        }));
        setFarmers(formatted);
      }
    } catch (err) {
      console.error("Live farmers fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveFarmers();

    // Supabase Realtime Listener for instant synchronization
    if (supabase) {
      const channel = supabase
        .channel("realtime_farmers_tab")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "farmers" },
          () => fetchLiveFarmers()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  // Filter Counts
  const totalCount = farmers.length;
  const approvedCount = farmers.filter(
    (f) => f.status === "APPROVED" || f.status === "ACTIVE"
  ).length;
  const pendingCount = farmers.filter((f) => f.status === "PENDING_APPROVAL" || f.status === "PENDING").length;

  // Filtered List
  const filteredFarmers = useMemo(() => {
    return farmers.filter((f) => {
      const q = query.toLowerCase().trim();
      const matchesSearch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.phone.includes(q) ||
        f.village.toLowerCase().includes(q) ||
        f.crop.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (activeTab === "approved") return f.status === "APPROVED" || f.status === "ACTIVE";
      if (activeTab === "pending") return f.status === "PENDING_APPROVAL" || f.status === "PENDING";
      return true;
    });
  }, [query, farmers, activeTab]);

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
                DAE নিবন্ধিত কৃষক ডাটাবেজ
              </AppText>
            </View>
            <AppText weight="bold" style={styles.mainTitle}>
              {t("farmers.title")}
            </AppText>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/farmer/new")}
            style={styles.addFarmerBtn}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#15803d" strokeWidth={3} />
            <AppText weight="bold" style={styles.addFarmerBtnText}>
              {locale === "bn" ? "নতুন কৃষক" : "Add Farmer"}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Metrics Row */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <AppText weight="bold" style={styles.statValue}>
              {totalCount}
            </AppText>
            <AppText style={styles.statLabel}>মোট কৃষক</AppText>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <AppText weight="bold" style={[styles.statValue, { color: "#4ade80" }]}>
              {approvedCount}
            </AppText>
            <AppText style={styles.statLabel}>অনুমোদিত</AppText>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <AppText weight="bold" style={[styles.statValue, { color: "#facc15" }]}>
              {pendingCount}
            </AppText>
            <AppText style={styles.statLabel}>অপেক্ষমাণ</AppText>
          </View>
        </View>
      </LinearGradient>

      {/* ── Search & Filter Tabs Toolbar ── */}
      <View style={styles.toolbarContainer}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color="#94a3b8" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("farmers.search_placeholder")}
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
              {locale === "bn" ? "সব" : "All"} ({totalCount})
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("approved")}
            style={[styles.tabChip, activeTab === "approved" && styles.tabChipActive]}
          >
            <CheckCircle2 size={13} color={activeTab === "approved" ? "#ffffff" : "#166534"} />
            <AppText
              weight="semibold"
              style={[styles.tabChipText, activeTab === "approved" && styles.tabChipTextActive]}
            >
              অনুমোদিত ({approvedCount})
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

      {/* ── Farmers List ── */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#166534" />
          <AppText style={styles.loadingText}>কৃষক তালিকা লোড হচ্ছে...</AppText>
        </View>
      ) : filteredFarmers.length === 0 ? (
        <View style={styles.centerBox}>
          <EmptyState
            icon={<UserRoundPlus size={36} color="#166534" />}
            title={
              query || activeTab !== "all"
                ? "কোনো মিল পাওয়া যায়নি"
                : t("farmers.empty_title")
            }
            subtitle={
              query || activeTab !== "all"
                ? "অন্য সার্চ কি-ওয়ার্ড দিয়ে চেষ্টা করুন।"
                : t("farmers.empty_subtitle")
            }
          />
          <View style={{ marginTop: 16 }}>
            <Button onPress={() => router.push("/farmer/new")}>
              {t("farmers.add_button")}
            </Button>
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredFarmers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchLiveFarmers();
              }}
              colors={[COLORS.success]}
            />
          }
          renderItem={({ item }) => {
            const isApproved = item.status === "APPROVED" || item.status === "ACTIVE";
            return (
              <AnimatedPressCard
                onPress={() =>
                  router.push({ pathname: "/farmer/[id]", params: { id: item.id } })
                }
                style={styles.farmerCard}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={styles.avatarWrapper}>
                    <Avatar name={item.name} size="md" />
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: isApproved ? "#22c55e" : "#f59e0b" },
                      ]}
                    />
                  </View>

                  <View style={styles.cardMainDetails}>
                    <View style={styles.nameRow}>
                      <AppText weight="bold" style={styles.farmerName}>
                        {item.name}
                      </AppText>
                      <Badge
                        tone={isApproved ? "success" : "warning"}
                        label={isApproved ? "অনুমোদিত" : "অপেক্ষমাণ"}
                      />
                    </View>

                    {/* Metadata Pills */}
                    <View style={styles.metaRow}>
                      {item.phone && item.phone !== "-" ? (
                        <View style={styles.pill}>
                          <Phone size={11} color="#64748b" />
                          <AppText style={styles.pillText}>{item.phone}</AppText>
                        </View>
                      ) : null}

                      {item.village ? (
                        <View style={styles.pill}>
                          <MapPin size={11} color="#64748b" />
                          <AppText style={styles.pillText}>{item.village}</AppText>
                        </View>
                      ) : null}

                      {item.crop ? (
                        <View style={[styles.pill, styles.cropPill]}>
                          <Sprout size={11} color="#166534" />
                          <AppText weight="semibold" style={styles.cropPillText}>
                            {item.crop}
                          </AppText>
                        </View>
                      ) : null}

                      {item.landDecimal ? (
                        <View style={styles.pill}>
                          <AppText style={styles.pillText}>
                            {item.landDecimal} শতক
                          </AppText>
                        </View>
                      ) : null}
                    </View>
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
  addFarmerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addFarmerBtnText: {
    fontSize: 13,
    color: "#15803d",
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
  farmerCard: {
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
  avatarWrapper: {
    position: "relative",
  },
  statusDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  cardMainDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  farmerName: {
    fontSize: 15,
    color: "#0F172A",
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
});

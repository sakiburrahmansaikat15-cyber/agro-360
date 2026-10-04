import { useRouter } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  TextInput,
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useState, useEffect } from "react";
import {
  Camera,
  Check,
  ChevronRight,
  Clock,
  Edit2,
  Globe,
  Headphones,
  LogOut,
  MapPin,
  Package,
  Phone,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  ClipboardList,
} from "lucide-react-native";

import { AppText } from "@/components/ui/AppText";
import { HERO_GRADIENT, COLORS } from "@/constants/theme";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage, useT } from "@/lib/i18n/context";
import { useUser } from "@/lib/context/UserContext";
import { supabase } from "@/lib/supabase";

export default function ProfileScreen() {
  const t = useT();
  const { locale, toggleLocale } = useLanguage();
  const router = useRouter();

  const {
    name,
    setName,
    profilePicture,
    setProfilePicture,
    phone,
    agentCode,
    region,
    user,
    agent,
    logout,
  } = useUser();

  const [isEditing, setIsEditing] = useState(false);
  const [localName, setLocalName] = useState(name);

  // Live Stats State from Supabase
  const [farmerCount, setFarmerCount] = useState<number>(0);
  const [batchCount, setBatchCount] = useState<number>(0);
  const [taskCount, setTaskCount] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);

  useEffect(() => {
    setLocalName(name);
  }, [name]);

  const loadLiveStats = async () => {
    if (!supabase) {
      setLoadingStats(false);
      return;
    }

    try {
      // 1. Registered Farmers
      const { count: fCount } = await supabase
        .from("farmers")
        .select("*", { count: "exact", head: true });

      // 2. Crop Batches
      const { count: bCount } = await supabase
        .from("batches")
        .select("*", { count: "exact", head: true });

      // 3. Assigned Tasks for this agent
      let tCount = 0;
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
        const { count: taskResCount } = await supabase
          .from("task_assignments")
          .select("*", { count: "exact", head: true })
          .eq("agent_id", agentDbId);
        tCount = taskResCount || 0;
      }

      setFarmerCount(fCount || 0);
      setBatchCount(bCount || 0);
      setTaskCount(tCount);
    } catch (err) {
      console.error("Live profile stats error:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadLiveStats();

    // Supabase Realtime Subscriptions
    if (supabase) {
      const channel = supabase
        .channel("realtime_profile_stats")
        .on("postgres_changes", { event: "*", schema: "public", table: "farmers" }, loadLiveStats)
        .on("postgres_changes", { event: "*", schema: "public", table: "batches" }, loadLiveStats)
        .on("postgres_changes", { event: "*", schema: "public", table: "task_assignments" }, loadLiveStats)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, agent]);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        await setProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("ত্রুটি", "ছবি নির্বাচন করা সম্ভব হয়নি");
    }
  };

  const handleSaveName = async () => {
    if (localName.trim() === "") {
      setLocalName(name);
    } else {
      await setName(localName);
    }
    setIsEditing(false);
  };

  const handleManualRefresh = async () => {
    setSyncing(true);
    await loadLiveStats();
    setSyncing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header Identity Gradient Card ── */}
        <LinearGradient
          colors={HERO_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroBadgeRow}>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={13} color="#86efac" />
              <AppText weight="bold" style={styles.verifiedBadgeText}>
                DAE ভেরিফায়েড এজেন্ট
              </AppText>
            </View>

            <TouchableOpacity
              onPress={handleManualRefresh}
              style={styles.refreshIconBtn}
              activeOpacity={0.7}
            >
              <RefreshCw size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Avatar Container */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              {profilePicture ? (
                <Image
                  source={{ uri: profilePicture }}
                  style={styles.avatarImg}
                  contentFit="cover"
                />
              ) : (
                <Avatar name={name} size="lg" />
              )}

              {/* Camera Trigger */}
              <TouchableOpacity
                onPress={handlePickImage}
                style={styles.cameraBadge}
                activeOpacity={0.8}
              >
                <Camera size={14} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Photo Action Pill */}
            <View style={styles.photoActions}>
              <TouchableOpacity
                onPress={handlePickImage}
                style={styles.photoPill}
                activeOpacity={0.7}
              >
                <Camera size={12} color="#ffffff" />
                <AppText weight="semibold" style={styles.photoPillText}>
                  {t("profile.upload")}
                </AppText>
              </TouchableOpacity>
              {profilePicture ? (
                <TouchableOpacity
                  onPress={() => setProfilePicture(null)}
                  style={styles.deletePhotoPill}
                  activeOpacity={0.7}
                >
                  <Trash2 size={12} color="#fca5a5" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Editable Name */}
            <View style={styles.nameContainer}>
              {isEditing ? (
                <View style={styles.nameEditRow}>
                  <TextInput
                    value={localName}
                    onChangeText={setLocalName}
                    style={styles.nameInput}
                    autoFocus
                    onBlur={handleSaveName}
                    onSubmitEditing={handleSaveName}
                  />
                  <TouchableOpacity onPress={handleSaveName} style={styles.saveNameBtn}>
                    <Check size={16} color="#ffffff" strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setIsEditing(true)}
                  style={styles.nameTouchRow}
                  activeOpacity={0.8}
                >
                  <AppText weight="bold" style={styles.agentNameText}>
                    {name}
                  </AppText>
                  <Edit2 size={15} color="#86efac" />
                </TouchableOpacity>
              )}
            </View>

            {/* Agent Code Tag */}
            <View style={styles.codeTag}>
              <AppText weight="bold" style={styles.codeTagText}>
                আইডি: {agentCode || "AGT-3601"}
              </AppText>
            </View>
          </View>
        </LinearGradient>

        {/* ── Impact Metrics Grid ── */}
        <View style={styles.statsGrid}>
          <View style={styles.metricCard}>
            <View style={[styles.iconBox, { backgroundColor: "#F0FDF4" }]}>
              <Users size={18} color="#166534" />
            </View>
            <AppText weight="bold" style={styles.metricValueText}>
              {loadingStats ? "-" : farmerCount}
            </AppText>
            <AppText style={styles.metricLabelText}>নিবন্ধিত কৃষক</AppText>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconBox, { backgroundColor: "#FEF3C7" }]}>
              <Package size={18} color="#d97706" />
            </View>
            <AppText weight="bold" style={styles.metricValueText}>
              {loadingStats ? "-" : batchCount}
            </AppText>
            <AppText style={styles.metricLabelText}>তৈরি ব্যাচ</AppText>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconBox, { backgroundColor: "#EFF6FF" }]}>
              <ClipboardList size={18} color="#2563eb" />
            </View>
            <AppText weight="bold" style={styles.metricValueText}>
              {loadingStats ? "-" : taskCount}
            </AppText>
            <AppText style={styles.metricLabelText}>অ্যাসাইনকৃত টাস্ক</AppText>
          </View>
        </View>

        {/* ── Workplace & Contact Info Card ── */}
        <Card style={styles.sectionCard}>
          <AppText weight="bold" style={styles.sectionHeaderTitle}>
            {locale === "bn" ? "কর্মক্ষেত্র ও যোগাযোগ" : "Workplace & Contact"}
          </AppText>
          <View style={styles.infoDivider} />

          <InfoRow
            icon={<Phone size={16} color="#64748b" />}
            label={t("auth.phone_label")}
            value={phone || "01796133638"}
          />
          <InfoRow
            icon={<MapPin size={16} color="#64748b" />}
            label={t("profile.region")}
            value={region || "বগুড়া সদর, বগুড়া"}
          />
        </Card>

        {/* ── Real-Time Sync Status ── */}
        <Card style={styles.sectionCard}>
          <View style={styles.syncRow}>
            <View style={styles.syncLeft}>
              <View style={styles.syncIconBox}>
                <RefreshCw size={18} color="#166534" />
              </View>
              <View>
                <AppText weight="bold" style={styles.syncTitle}>
                  {t("profile.sync_title")}
                </AppText>
                <AppText style={styles.syncSubtitle}>
                  লাইভ ডাটাবেজ সঙ্ক্রান্ত তথ্যাদি স্বয়ংক্রিয়ভাবে সিঙ্কড
                </AppText>
              </View>
            </View>
            <Badge tone="success" label="রিয়েল-টাইম লাইভ" />
          </View>
        </Card>

        {/* ── Language Switcher ── */}
        <TouchableOpacity onPress={toggleLocale} activeOpacity={0.8}>
          <Card style={[styles.sectionCard, styles.rowCard]}>
            <View style={styles.cardLeftRow}>
              <View style={styles.iconCircle}>
                <Globe size={18} color="#475569" />
              </View>
              <View>
                <AppText style={styles.smallLabel}>{t("profile.language")}</AppText>
                <AppText weight="bold" style={styles.mainValueText}>
                  {locale === "bn" ? "বাংলা (Bangla)" : "English"}
                </AppText>
              </View>
            </View>

            <View style={styles.switchPill}>
              <AppText weight="semibold" style={styles.switchPillText}>
                {locale === "bn" ? "English" : "বাংলা"}
              </AppText>
              <ChevronRight size={14} color="#64748b" />
            </View>
          </Card>
        </TouchableOpacity>

        {/* ── Support Helpline ── */}
        <TouchableOpacity activeOpacity={0.8}>
          <Card style={[styles.sectionCard, styles.rowCard, styles.helpCard]}>
            <View style={styles.cardLeftRow}>
              <View style={[styles.iconCircle, { backgroundColor: "#166534" }]}>
                <Headphones size={18} color="#ffffff" />
              </View>
              <View>
                <AppText style={styles.smallLabel}>{t("profile.help_title")}</AppText>
                <AppText weight="bold" style={styles.helpNumberText}>
                  DAE হেল্পলাইন (১৬১২৩)
                </AppText>
              </View>
            </View>
            <PhoneCall size={18} color="#166534" />
          </Card>
        </TouchableOpacity>

        {/* ── Logout Action ── */}
        <TouchableOpacity
          onPress={async () => {
            await logout();
            router.replace("/login");
          }}
          style={styles.logoutBtn}
          activeOpacity={0.8}
        >
          <View style={styles.logoutIconBox}>
            <LogOut size={18} color="#dc2626" />
          </View>
          <AppText weight="bold" style={styles.logoutBtnText}>
            {t("profile.logout")}
          </AppText>
        </TouchableOpacity>

        {/* ── App Version Footer ── */}
        <View style={styles.footerCenter}>
          <AppText style={styles.versionText}>
            {t("profile.version")} 1.0.0 · Agro-Trust 360 Agent System
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.infoRowContainer}>
      <View style={styles.infoRowLeft}>
        <View style={styles.infoIconBox}>{icon}</View>
        <AppText style={styles.infoLabelText}>{label}</AppText>
      </View>
      <AppText weight="semibold" style={styles.infoValueText}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
    gap: 14,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  heroBadgeRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  verifiedBadgeText: {
    fontSize: 11,
    color: "#86efac",
  },
  refreshIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSection: {
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    backgroundColor: "#F1F5F9",
    overflow: "visible",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 48,
  },
  cameraBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#166534",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  photoActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  photoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  photoPillText: {
    fontSize: 12,
    color: "#FFFFFF",
  },
  deletePhotoPill: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    padding: 6,
    borderRadius: 999,
  },
  nameContainer: {
    marginTop: 12,
    alignItems: "center",
  },
  nameTouchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  agentNameText: {
    fontSize: 22,
    color: "#FFFFFF",
  },
  nameEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  nameInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  saveNameBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
  },
  codeTag: {
    marginTop: 6,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  codeTagText: {
    fontSize: 12,
    color: "#86efac",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  metricValueText: {
    fontSize: 18,
    color: "#0F172A",
    marginTop: 8,
  },
  metricLabelText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 10,
  },
  infoRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  infoRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabelText: {
    fontSize: 12,
    color: "#64748B",
  },
  infoValueText: {
    fontSize: 13,
    color: "#0F172A",
  },
  syncRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  syncLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  syncIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  syncTitle: {
    fontSize: 14,
    color: "#0F172A",
  },
  syncSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  smallLabel: {
    fontSize: 11,
    color: "#64748B",
  },
  mainValueText: {
    fontSize: 14,
    color: "#0F172A",
    marginTop: 1,
  },
  switchPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  switchPillText: {
    fontSize: 11,
    color: "#475569",
  },
  helpCard: {
    backgroundColor: "#F0FDF4",
    borderColor: "#DCFCE7",
  },
  helpNumberText: {
    fontSize: 14,
    color: "#166534",
    marginTop: 1,
  },
  logoutBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FECACA",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 6,
    shadowColor: "#ef4444",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  logoutBtnText: {
    fontSize: 15,
    color: "#DC2626",
  },
  footerCenter: {
    alignItems: "center",
    marginTop: 8,
  },
  versionText: {
    fontSize: 12,
    color: "#94A3B8",
  },
});

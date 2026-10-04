import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import {
  Camera,
  CheckCircle2,
  CreditCard,
  FileText,
  Globe,
  Landmark,
  MapPin,
  Navigation,
  Phone,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  Wallet,
  Check,
  ChevronRight,
  AlertCircle,
} from "lucide-react-native";
import { useState, useEffect } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useQueryClient } from "@tanstack/react-query";

import { AppText } from "@/components/ui/AppText";
import { HERO_GRADIENT } from "@/constants/theme";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SearchableSelectModal } from "@/components/ui/SearchableSelectModal";
import { DynamicCropSelect } from "@/components/wizard/DynamicCropSelect";
import { WizardFooter } from "@/components/wizard/WizardFooter";
import { WizardHeader } from "@/components/wizard/WizardHeader";
import { useLanguage, useT } from "@/lib/i18n/context";
import { all64Districts, cropOptions } from "@/lib/mock-data";
import { getUpazilasForDistrict } from "@/lib/bangladeshUpazilas";
import { getDb } from "@/lib/db";
import { useUser } from "@/lib/context/UserContext";
import { uuidv4 } from "@/lib/uuid";
import { supabase } from "@/lib/supabase";

type FormState = {
  nid: string;
  nidPhoto: string | null;
  name: string;
  phone: string;
  wallet: string;
  district: string;
  upazila: string;
  village: string;
  land: string;
  crop: string;
  latitude: number | null;
  longitude: number | null;
};

const initialState: FormState = {
  nid: "",
  nidPhoto: null,
  name: "",
  phone: "",
  wallet: "",
  district: "",
  upazila: "",
  village: "",
  land: "",
  crop: "",
  latitude: null,
  longitude: null,
};

export default function NewFarmerScreen() {
  const t = useT();
  const { locale } = useLanguage();
  const router = useRouter();
  const { user, agent } = useUser();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [offlineQueued, setOfflineQueued] = useState(false);
  // The real database primary key (sent as farmers.id) and the short
  // human-readable code shown to the agent / printed on the QR sticker
  // (farmers.display_id) are generated together up front, so a later
  // scan/lookup by the printed code can always find the real row — before
  // this fix, the id sent to Supabase was a server-generated UUID unrelated
  // to the code shown on screen.
  const [farmerRowId] = useState(() => uuidv4());
  const [farmerId] = useState(() => `AGT-FARM-${Math.floor(10000 + Math.random() * 90000)}`);

  const fetchLocation = async () => {
    setLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        let location = await Location.getCurrentPositionAsync({});
        setForm((prev) => ({
          ...prev,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }));
      }
    } catch (e) {
      console.warn("Location fetch error:", e);
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  const update = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled) {
      update({ nidPhoto: result.assets[0].uri });
    }
  };

  const step1Valid = form.nid.trim().length >= 10 && form.name.trim().length > 0 && form.phone.trim().length >= 10;
  const step2Valid = form.district && form.upazila && form.village.trim().length > 0 && form.land.trim().length > 0 && form.crop;

  const handleBack = () => {
    if (step === 1) {
      router.back();
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    let synced = false;
    try {
      // Resolve the agent's real database id up front — required both to
      // attribute the farmer correctly and because the RLS policy on
      // farmers.insert checks agent_id = current_agent_id() (see
      // supabase_migration_002_rbac.sql). Without this, the insert would be
      // silently rejected by the database for any agent record.
      let agentDbId = agent?.id || null;
      if (!agentDbId && user && supabase) {
        try {
          const rawPhone = (user.email || "").split("@")[0];
          const { data: agentData } = await supabase
            .from("agents")
            .select("id")
            .or(`user_id.eq.${user.id},phone.eq.${rawPhone}`)
            .maybeSingle();
          agentDbId = agentData?.id || null;
        } catch (err) {
          console.error("Could not resolve agent id:", err);
        }
      }

      const payload = {
        id: farmerRowId,
        display_id: farmerId,
        agent_id: agentDbId,
        name: form.name.trim(),
        phone: form.phone.trim(),
        village: form.village.trim() || form.upazila || form.district || "Bogra",
        union_name: form.upazila || form.district || "Sadar",
        district: form.district || null,
        landDecimal: parseFloat(form.land) || 0,
        crop: form.crop || "Rice",
        hasWallet: !!form.wallet,
        status: "APPROVED",
        synced_at: new Date().toISOString(),
      };

      // Attempt the live Supabase write first.
      if (supabase) {
        try {
          const { error } = await supabase.from("farmers").insert([payload]);
          synced = !error;
          if (error) console.error("Live Supabase farmer insert error:", error);
        } catch (supabaseErr) {
          console.error("Live Supabase farmer insert error:", supabaseErr);
        }
      }

      // Best-effort NID photo upload to Supabase Storage. This never blocks
      // registration — previously the captured photo was kept only in local
      // component state for on-screen preview and was never sent anywhere,
      // despite farmers.documents existing in the schema for exactly this.
      // Requires a public "farmer-documents" bucket to exist in the Supabase
      // project's Storage settings.
      if (synced && supabase && form.nidPhoto) {
        try {
          const response = await fetch(form.nidPhoto);
          const blob = await response.blob();
          const path = `${farmerRowId}/nid.jpg`;
          const { error: uploadError } = await supabase.storage
            .from("farmer-documents")
            .upload(path, blob, { contentType: "image/jpeg", upsert: true });

          if (uploadError) {
            console.error("NID photo upload failed:", uploadError);
          } else {
            const { data: publicUrlData } = supabase.storage
              .from("farmer-documents")
              .getPublicUrl(path);
            if (publicUrlData?.publicUrl) {
              await supabase
                .from("farmers")
                .update({ documents: [publicUrlData.publicUrl] })
                .eq("id", farmerRowId);
            }
          }
        } catch (uploadErr) {
          console.error("NID photo upload failed:", uploadErr);
        }
      }

      // Always keep a local copy: SYNCED if the write above succeeded,
      // PENDING (with the full payload for retry) if it didn't — so a
      // failed submission is retried automatically instead of being
      // reported to the agent as a success while silently going nowhere.
      const db = await getDb();
      await db.runAsync(
        `INSERT INTO farmers (id, display_id, agent_id, name, phone, village, union_name, district, landDecimal, crop, registeredDaysAgo, hasWallet, latitude, longitude, sync_status, payload)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
        [
          farmerRowId,
          farmerId,
          agentDbId,
          payload.name,
          payload.phone,
          payload.village,
          payload.union_name,
          payload.district,
          payload.landDecimal,
          payload.crop,
          payload.hasWallet ? 1 : 0,
          form.latitude,
          form.longitude,
          synced ? "SYNCED" : "PENDING",
          JSON.stringify(payload),
        ]
      );

      setOfflineQueued(!synced);
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      setStep(4);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // Step 4: Success Screen
  if (step === 4) {
    return (
      <SafeAreaView style={styles.successContainer} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={styles.successScroll}>
          <View style={styles.successWrapper}>
            {/* Success Icon */}
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={56} color="#166534" strokeWidth={2.5} />
            </View>

            <AppText weight="bold" style={styles.successTitle}>
              {offlineQueued
                ? locale === "bn"
                  ? "অফলাইনে সংরক্ষিত হয়েছে"
                  : "Saved offline"
                : t("farmerForm.success_title")}
            </AppText>
            <AppText style={styles.successSub}>
              {offlineQueued
                ? locale === "bn"
                  ? "ইন্টারনেট সংযোগ ফিরে এলে স্বয়ংক্রিয়ভাবে সিঙ্ক হবে।"
                  : "This will sync automatically once you're back online."
                : t("farmerForm.success_subtitle")}
            </AppText>

            {/* Digital Agro-ID Card Badge */}
            <LinearGradient
              colors={HERO_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.agroIdCard}
            >
              <View style={styles.cardBadgeHeader}>
                <View style={styles.cardBadgeLeft}>
                  <ShieldCheck size={18} color="#86efac" />
                  <AppText weight="bold" style={styles.cardBadgeTitle}>
                    ডিজিটাল কৃষক আইডি (Agro-ID)
                  </AppText>
                </View>
                <View style={styles.activePill}>
                  <AppText weight="bold" style={styles.activePillText}>
                    সক্রিয়
                  </AppText>
                </View>
              </View>

              <View style={styles.cardBadgeBody}>
                <View style={{ flex: 1 }}>
                  <AppText style={styles.cardLabel}>{t("farmerForm.name_label")}</AppText>
                  <AppText weight="bold" style={styles.cardNameValue}>
                    {form.name}
                  </AppText>

                  <AppText style={[styles.cardLabel, { marginTop: 10 }]}>
                    {t("farmerForm.success_id")}
                  </AppText>
                  <AppText weight="bold" style={styles.cardIdValue}>
                    {farmerId}
                  </AppText>
                </View>

                <View style={styles.qrCodeBox}>
                  <QrCode size={44} color="#0f172a" />
                </View>
              </View>
            </LinearGradient>

            {/* Action Buttons */}
            <View style={styles.successActions}>
              <Button
                onPress={() => {
                  setForm(initialState);
                  setStep(1);
                }}
                variant="secondary"
              >
                {t("farmerForm.add_another")}
              </Button>
              <Button onPress={() => router.back()}>{t("farmerForm.done_button")}</Button>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const stepLabels = [
    t("farmerForm.step_identity"),
    t("farmerForm.step_location"),
    t("farmerForm.step_review"),
  ];

  return (
    <View style={styles.container}>
      <WizardHeader
        title={t("farmerForm.title")}
        stepLabel={`${step}/3 · ${stepLabels[step - 1]}`}
        totalSteps={3}
        currentStep={step}
        onBack={handleBack}
      />

      {/* Step Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.formScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formWrapper}>
            {/* Step 1: Identity & Personal Details */}
            {step === 1 && (
              <>
                <View style={styles.stepBanner}>
                  <View style={styles.stepBannerIcon}>
                    <User size={22} color="#166534" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText weight="bold" style={styles.stepBannerTitle}>
                      {locale === "bn" ? "কৃষকের পরিচয় ও সাধারণ তথ্য" : "Farmer Identity & Details"}
                    </AppText>
                    <AppText style={styles.stepBannerSub}>
                      {locale === "bn" ? "জাতীয় পরিচয়পত্র ও যোগাযোগের সঠিক তথ্য লিখুন" : "Enter correct NID and contact information"}
                    </AppText>
                  </View>
                </View>

                {/* Card 1: NID Document Photo */}
                <Card style={styles.formCard}>
                  <AppText weight="semibold" style={styles.cardFieldTitle}>
                    {t("farmerForm.nid_photo")}
                  </AppText>

                  <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                    {form.nidPhoto ? (
                      <View style={styles.nidPreviewBox}>
                        <Image source={{ uri: form.nidPhoto }} style={styles.nidPreviewImg} contentFit="cover" />
                        <View style={styles.nidOverlayBadge}>
                          <Trash2 size={13} color="#fca5a5" />
                          <AppText style={styles.nidOverlayText}>পরিবর্তন করুন</AppText>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.nidUploadBox}>
                        <View style={styles.nidUploadCircle}>
                          <Camera size={26} color="#166534" />
                        </View>
                        <AppText weight="semibold" style={styles.nidUploadTitle}>
                          {t("farmerForm.nid_photo")}
                        </AppText>
                        <AppText style={styles.nidUploadSub}>
                          {t("farmerForm.nid_photo_sub")}
                        </AppText>
                      </View>
                    )}
                  </TouchableOpacity>
                </Card>

                {/* Card 2: NID & Name */}
                <Card style={styles.formCard}>
                  <Input
                    label={t("farmerForm.nid_label")}
                    placeholder={t("farmerForm.nid_placeholder")}
                    keyboardType="number-pad"
                    value={form.nid}
                    onChangeText={(v) => update({ nid: v })}
                    icon={<CreditCard size={18} color="#64748b" />}
                  />
                  <Input
                    label={t("farmerForm.name_label")}
                    placeholder={t("farmerForm.name_placeholder")}
                    value={form.name}
                    onChangeText={(v) => update({ name: v })}
                    icon={<User size={18} color="#64748b" />}
                  />
                </Card>

                {/* Card 3: Phone & Mobile Wallet */}
                <Card style={styles.formCard}>
                  <Input
                    label={t("farmerForm.phone_label")}
                    placeholder={t("farmerForm.phone_placeholder")}
                    keyboardType="phone-pad"
                    value={form.phone}
                    onChangeText={(v) => update({ phone: v })}
                    icon={<Phone size={18} color="#64748b" />}
                  />
                  <Input
                    label={t("farmerForm.wallet_label")}
                    placeholder={t("farmerForm.wallet_placeholder")}
                    sublabel={t("farmerForm.wallet_sub")}
                    keyboardType="phone-pad"
                    value={form.wallet}
                    onChangeText={(v) => update({ wallet: v })}
                    icon={<Wallet size={18} color="#64748b" />}
                  />
                </Card>
              </>
            )}

            {/* Step 2: Location & Crop Info */}
            {step === 2 && (
              <>
                <View style={styles.stepBanner}>
                  <View style={styles.stepBannerIcon}>
                    <MapPin size={22} color="#166534" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText weight="bold" style={styles.stepBannerTitle}>
                      {locale === "bn" ? "জমির অবস্থান ও প্রধান ফসল" : "Land & Location Information"}
                    </AppText>
                    <AppText style={styles.stepBannerSub}>
                      {locale === "bn" ? "কৃষকের জমি, অবস্থান ও ফসলের তথ্য নির্বাচন করুন" : "Select district, upazila and crop details"}
                    </AppText>
                  </View>
                </View>

                {/* Live GPS Coordinates Card */}
                <Card style={[styles.formCard, styles.gpsCard]}>
                  <View style={styles.gpsRow}>
                    <View style={styles.gpsLeft}>
                      <View style={styles.gpsIconCircle}>
                        <Navigation size={18} color="#ffffff" />
                      </View>
                      <View>
                        <AppText weight="semibold" style={styles.gpsTitle}>
                          {locale === "bn" ? "GPS ম্যাপ লোকেশন" : "Live GPS Location"}
                        </AppText>
                        <AppText style={styles.gpsSub}>
                          {form.latitude && form.longitude
                            ? `${form.latitude.toFixed(4)}° N, ${form.longitude.toFixed(4)}° E`
                            : locale === "bn"
                            ? "লোকেশন খোঁজা হচ্ছে..."
                            : "Fetching coordinates..."}
                        </AppText>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={fetchLocation}
                      disabled={locating}
                      style={styles.gpsRefreshBtn}
                    >
                      <RefreshCw size={12} color="#166534" />
                      <AppText weight="medium" style={styles.gpsRefreshText}>
                        {locating ? "ম্যাপ..." : "রিফ্রেশ"}
                      </AppText>
                    </TouchableOpacity>
                  </View>
                </Card>

                {/* District & Upazila Selection */}
                <Card style={styles.formCard}>
                  <SearchableSelectModal
                    label={t("farmerForm.district_label")}
                    placeholder="জেলা নির্বাচন বা অনুসন্ধান করুন (৬৪ জেলা)"
                    options={all64Districts}
                    value={form.district}
                    onSelect={(v) => update({ district: v, upazila: "" })}
                    icon={<Globe size={18} color="#64748b" />}
                  />

                  <View style={styles.cardDivider}>
                    <SearchableSelectModal
                      label={t("farmerForm.upazila_label")}
                      placeholder={
                        form.district
                          ? `${form.district} জেলার উপজেলা নির্বাচন করুন`
                          : "উপজেলা নির্বাচন বা অনুসন্ধান করুন"
                      }
                      options={getUpazilasForDistrict(form.district)}
                      value={form.upazila}
                      onSelect={(v) => update({ upazila: v })}
                      icon={<MapPin size={18} color="#64748b" />}
                    />
                  </View>
                </Card>

                {/* Village & Land Size */}
                <Card style={styles.formCard}>
                  <Input
                    label={t("farmerForm.union_label")}
                    placeholder={t("farmerForm.union_placeholder")}
                    value={form.village}
                    onChangeText={(v) => update({ village: v })}
                    icon={<MapPin size={18} color="#64748b" />}
                  />
                  <Input
                    label={t("farmerForm.land_label")}
                    placeholder={t("farmerForm.land_placeholder")}
                    keyboardType="number-pad"
                    value={form.land}
                    onChangeText={(v) => update({ land: v })}
                    icon={<Landmark size={18} color="#64748b" />}
                  />
                </Card>

                {/* Crop Selection */}
                <Card style={styles.formCard}>
                  <AppText weight="semibold" style={styles.cardFieldTitle}>
                    {t("farmerForm.crop_label")}
                  </AppText>
                  <DynamicCropSelect
                    initialCrops={cropOptions}
                    value={form.crop}
                    onChange={(v) => update({ crop: v })}
                  />
                </Card>
              </>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <>
                <View style={styles.stepBanner}>
                  <View style={styles.stepBannerIcon}>
                    <FileText size={22} color="#166534" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText weight="bold" style={styles.stepBannerTitle}>
                      {t("farmerForm.review_title")}
                    </AppText>
                    <AppText style={styles.stepBannerSub}>
                      {t("farmerForm.review_subtitle")}
                    </AppText>
                  </View>
                </View>

                {/* Review Card Badge Preview */}
                <LinearGradient
                  colors={HERO_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.reviewCardPreview}
                >
                  <View style={styles.reviewCardHeader}>
                    <View style={styles.cardBadgeLeft}>
                      <Sparkles size={16} color="#86efac" />
                      <AppText weight="bold" style={styles.reviewCardTitle}>
                        কৃষক নিবন্ধন প্রিভিউ
                      </AppText>
                    </View>
                    <Badge tone="success" label="যাচাই প্রস্তুত" />
                  </View>

                  <View style={styles.reviewCardBody}>
                    {form.nidPhoto ? (
                      <Image source={{ uri: form.nidPhoto }} style={styles.reviewAvatarImg} contentFit="cover" />
                    ) : (
                      <View style={styles.reviewAvatarFallback}>
                        <User size={32} color="#ffffff" />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <AppText weight="bold" style={styles.reviewFarmerName}>
                        {form.name || "—"}
                      </AppText>
                      <AppText style={styles.reviewSubText}>
                        NID: {form.nid || "—"}
                      </AppText>
                      <AppText style={styles.reviewSubText}>
                        মোবাইল: {form.phone || "—"}
                      </AppText>
                    </View>
                  </View>
                </LinearGradient>

                {/* Summary Table Cards */}
                <Card style={styles.formCard}>
                  <AppText weight="bold" style={styles.summarySectionTitle}>
                    ব্যক্তিগত তথ্য
                  </AppText>
                  <ReviewRow label={t("farmerForm.name_label")} value={form.name} />
                  <ReviewRow label={t("farmerForm.phone_label")} value={form.phone} />
                  <ReviewRow label={t("farmerForm.nid_label")} value={form.nid} />
                  {form.wallet ? <ReviewRow label={t("farmerForm.wallet_label")} value={form.wallet} /> : null}
                </Card>

                <Card style={styles.formCard}>
                  <AppText weight="bold" style={styles.summarySectionTitle}>
                    অবস্থান ও কৃষি তথ্য
                  </AppText>
                  <ReviewRow label={t("farmerForm.district_label")} value={form.district} />
                  <ReviewRow label={t("farmerForm.upazila_label")} value={form.upazila} />
                  <ReviewRow label={t("farmerForm.union_label")} value={form.village} />
                  <ReviewRow label={t("farmerForm.land_label")} value={`${form.land} শতক`} />
                  <ReviewRow label={t("farmerForm.crop_label")} value={form.crop} />
                  {form.latitude && form.longitude && (
                    <ReviewRow
                      label="GPS অবস্থান"
                      value={`${form.latitude.toFixed(4)}°, ${form.longitude.toFixed(4)}°`}
                    />
                  )}
                </Card>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <WizardFooter
        onBack={handleBack}
        onNext={() => {
          if (step === 3) handleSubmit();
          else setStep((s) => s + 1);
        }}
        showBack={step > 1}
        backLabel={t("farmerForm.back_button")}
        nextLabel={step === 3 ? t("farmerForm.submit_button") : t("farmerForm.next_button")}
        nextDisabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
        loading={submitting}
      />
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewRowContainer}>
      <AppText style={styles.reviewRowLabel}>{label}</AppText>
      <AppText weight="semibold" style={styles.reviewRowValue}>
        {value || "—"}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  progressTrack: {
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#166534",
  },
  formScrollContent: {
    padding: 16,
    paddingBottom: 120,
    alignItems: "center",
  },
  formWrapper: {
    width: "100%",
    maxWidth: 672,
    gap: 14,
  },
  stepBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  stepBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBannerTitle: {
    fontSize: 15,
    color: "#0F172A",
  },
  stepBannerSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 14,
    shadowColor: "#0f172a",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardFieldTitle: {
    fontSize: 14,
    color: "#1E293B",
  },
  nidUploadBox: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#86efac",
    backgroundColor: "#F0FDF4",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  nidUploadCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  nidUploadTitle: {
    fontSize: 14,
    color: "#166534",
    marginTop: 10,
  },
  nidUploadSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    textAlign: "center",
  },
  nidPreviewBox: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    position: "relative",
  },
  nidPreviewImg: {
    width: "100%",
    height: 160,
  },
  nidOverlayBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  nidOverlayText: {
    fontSize: 11,
    color: "#FFFFFF",
  },
  gpsCard: {
    backgroundColor: "#F0FDF4",
    borderColor: "#DCFCE7",
  },
  gpsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gpsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  gpsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#166534",
    alignItems: "center",
    justifyContent: "center",
  },
  gpsTitle: {
    fontSize: 12,
    color: "#14532d",
  },
  gpsSub: {
    fontSize: 11,
    color: "#475569",
    marginTop: 1,
  },
  gpsRefreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#86efac",
  },
  gpsRefreshText: {
    fontSize: 11,
    color: "#166534",
  },
  cardDivider: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  reviewCardPreview: {
    borderRadius: 24,
    padding: 18,
  },
  reviewCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.15)",
    paddingBottom: 10,
  },
  cardBadgeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reviewCardTitle: {
    fontSize: 13,
    color: "#FFFFFF",
  },
  reviewCardBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 14,
  },
  reviewAvatarImg: {
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  reviewAvatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewFarmerName: {
    fontSize: 17,
    color: "#FFFFFF",
  },
  reviewSubText: {
    fontSize: 11,
    color: "#bbf7d0",
    marginTop: 2,
  },
  summarySectionTitle: {
    fontSize: 11,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reviewRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 8,
  },
  reviewRowLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  reviewRowValue: {
    fontSize: 13,
    color: "#0F172A",
  },
  successContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  successScroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  successWrapper: {
    width: "100%",
    maxWidth: 480,
    alignItems: "center",
  },
  successIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 22,
    color: "#0F172A",
    marginTop: 18,
    textAlign: "center",
  },
  successSub: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
  agroIdCard: {
    width: "100%",
    borderRadius: 24,
    padding: 20,
    marginTop: 24,
  },
  cardBadgeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.15)",
    paddingBottom: 10,
  },
  cardBadgeTitle: {
    fontSize: 13,
    color: "#FFFFFF",
  },
  activePill: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  activePillText: {
    fontSize: 11,
    color: "#FFFFFF",
  },
  cardBadgeBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  cardLabel: {
    fontSize: 11,
    color: "#bbf7d0",
  },
  cardNameValue: {
    fontSize: 17,
    color: "#FFFFFF",
    marginTop: 2,
  },
  cardIdValue: {
    fontSize: 18,
    color: "#86efac",
    marginTop: 2,
  },
  qrCodeBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  successActions: {
    width: "100%",
    gap: 10,
    marginTop: 24,
  },
});

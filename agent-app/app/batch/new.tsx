import { useRouter } from "expo-router";
import { CheckCircle2, Printer, Search, Share2, Weight } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { useQueryClient } from "@tanstack/react-query";

import { AppText } from "@/components/ui/AppText";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ChipSelect } from "@/components/wizard/ChipSelect";
import { WizardFooter } from "@/components/wizard/WizardFooter";
import { WizardHeader } from "@/components/wizard/WizardHeader";
import { useT } from "@/lib/i18n/context";
import { cropOptions, inputOptions } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import { getDb } from "@/lib/db";
import { useUser } from "@/lib/context/UserContext";
import { uuidv4 } from "@/lib/uuid";

type LiveFarmer = { id: string; name: string; village: string; crop: string };

type FormState = {
  farmerId: string | null;
  crop: string;
  quantity: string;
  harvestOption: string;
  inputs: string[];
  notes: string;
};

const initialState: FormState = {
  farmerId: null,
  crop: "",
  quantity: "",
  harvestOption: "",
  inputs: [],
  notes: "",
};

export default function NewBatchScreen() {
  const t = useT();
  const router = useRouter();
  const { user, agent } = useUser();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialState);
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [offlineQueued, setOfflineQueued] = useState(false);
  const [farmers, setFarmers] = useState<LiveFarmer[]>([]);
  const [farmersLoading, setFarmersLoading] = useState(true);
  // Real database primary key + short human-readable code, generated
  // together — see the matching comment in farmer/new.tsx for why.
  const [batchRowId] = useState(() => uuidv4());
  const [batchId] = useState(
    () => `AT360-BOG-${Math.floor(1000 + Math.random() * 9000).toString().slice(0, 4)}`
  );

  // The farmer picker used to read from lib/mock-data.ts, where `farmers` is
  // a permanently empty array — that made step 1 of this wizard impossible
  // to complete for any real agent. Fetch real, already-registered farmers
  // from Supabase instead, same as app/(tabs)/farmers.tsx.
  useEffect(() => {
    async function loadFarmers() {
      if (!supabase) {
        setFarmersLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("farmers")
          .select("id, name, village, crop")
          .order("synced_at", { ascending: false });
        if (!error && data) {
          setFarmers(
            data.map((f: any) => ({
              id: f.id,
              name: f.name || "কৃষক",
              village: f.village || "",
              crop: f.crop || "",
            }))
          );
        }
      } catch (err) {
        console.error("Error loading farmers for batch form:", err);
      } finally {
        setFarmersLoading(false);
      }
    }
    loadFarmers();
  }, []);

  const update = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const filteredFarmers = useMemo(
    () => farmers.filter((f) => f.name.toLowerCase().includes(query.toLowerCase())),
    [farmers, query]
  );

  const selectedFarmer = farmers.find((f) => f.id === form.farmerId);

  const step1Valid = !!form.farmerId;
  const step2Valid = form.crop && form.quantity.trim().length > 0 && form.harvestOption;
  const step3Valid = form.inputs.length > 0;

  const handleBack = () => {
    if (step === 1) router.back();
    else setStep((s) => s - 1);
  };

  const handleGenerate = async () => {
    setSubmitting(true);
    let synced = false;
    try {
      // Required for RLS: batches.insert checks agent_id = current_agent_id()
      // (see supabase_migration_002_rbac.sql) — without it, an insert made
      // under the new ownership-scoped policies would be rejected outright.
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
        id: batchRowId,
        display_id: batchId,
        agent_id: agentDbId,
        farmer_id: form.farmerId,
        farmerName: selectedFarmer?.name || "কৃষক",
        crop: form.crop || "Rice",
        quantityKg: parseFloat(form.quantity) || 500,
        harvestDate: form.harvestOption || new Date().toISOString().split("T")[0],
        inputs: form.inputs,
        synced_at: new Date().toISOString(),
      };

      if (supabase) {
        try {
          const { error } = await supabase.from("batches").insert([payload]);
          synced = !error;
          if (error) console.error("Supabase batch insert error:", error);
        } catch (err) {
          console.error("Supabase batch insert error:", err);
        }
      }

      // Keep a local copy either way: SYNCED if the write above succeeded,
      // PENDING (with the full payload for retry) if it didn't — previously
      // there was no local fallback at all for batches, so a failed insert
      // here meant the batch was recorded nowhere despite the success screen.
      try {
        const db = await getDb();
        await db.runAsync(
          `INSERT INTO batches (id, display_id, agent_id, farmerId, farmerName, crop, quantityKg, harvestDate, inputs, createdDaysAgo, sync_status, payload)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
          [
            batchRowId,
            batchId,
            agentDbId,
            form.farmerId,
            payload.farmerName,
            payload.crop,
            payload.quantityKg,
            payload.harvestDate,
            JSON.stringify(payload.inputs),
            synced ? "SYNCED" : "PENDING",
            JSON.stringify(payload),
          ]
        );
      } catch (dbErr) {
        console.error("Local batch cache write failed:", dbErr);
      }

      setOfflineQueued(!synced);
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    } finally {
      setSubmitting(false);
      setStep(5);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Agro-Trust 360 Batch ${batchId}\nFarmer: ${selectedFarmer?.name || "-"}\nCrop: ${form.crop || "-"} (${form.quantity || "-"} kg)`,
      });
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  if (step === 5) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
        <ScrollView contentContainerClassName="flex-1 items-center justify-center px-8 py-10">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-50">
            <CheckCircle2 size={30} color="#256b3f" />
          </View>
          <AppText weight="bold" className="mt-5 text-center text-xl text-slate-900">
            {offlineQueued ? "অফলাইনে সংরক্ষিত হয়েছে" : t("batchForm.success_title")}
          </AppText>
          <AppText className="mt-2 text-center text-sm leading-5 text-slate-500">
            {offlineQueued
              ? "ইন্টারনেট সংযোগ ফিরে এলে স্বয়ংক্রিয়ভাবে সিঙ্ক হবে।"
              : t("batchForm.success_subtitle")}
          </AppText>

          <View className="mt-6 items-center rounded-3xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-300/40">
            <QRCode value={batchId} size={168} color="#122e1e" backgroundColor="white" />
            <AppText className="mt-4 text-xs text-slate-400">{t("batchForm.batch_id")}</AppText>
            <AppText weight="bold" className="mt-1 font-mono text-base text-slate-900">
              {batchId}
            </AppText>
          </View>

          <View className="mt-6 w-full flex-row gap-3">
            <View className="flex-1">
              <Button
                variant="secondary"
                icon={<Printer size={16} color="#256b3f" />}
                onPress={() =>
                  Alert.alert(
                    "প্রিন্টার সংযুক্ত নেই",
                    "লেবেল প্রিন্ট করতে একটি সংযুক্ত প্রিন্টার প্রয়োজন। এই ডিভাইসে এখনও কোনো প্রিন্টার সেট আপ করা নেই।"
                  )
                }
              >
                {t("batchForm.print_button")}
              </Button>
            </View>
            <View className="flex-1">
              <Button variant="secondary" icon={<Share2 size={16} color="#256b3f" />} onPress={handleShare}>
                {t("batchForm.share_button")}
              </Button>
            </View>
          </View>
        </ScrollView>

        <View className="gap-3 px-6 pb-4">
          <Button
            variant="secondary"
            onPress={() => {
              setForm(initialState);
              setQuery("");
              setStep(1);
            }}
          >
            {t("batchForm.add_another")}
          </Button>
          <Button onPress={() => router.back()}>{t("batchForm.done_button")}</Button>
        </View>
      </SafeAreaView>
    );
  }

  const stepLabels = [
    t("batchForm.step_farmer"),
    t("batchForm.step_details"),
    t("batchForm.step_inputs"),
    t("batchForm.step_review"),
  ];

  return (
    <View className="flex-1 bg-slate-50">
      <WizardHeader
        title={t("batchForm.title")}
        stepLabel={`${step}/4 · ${stepLabels[step - 1]}`}
        totalSteps={4}
        currentStep={step}
        onBack={handleBack}
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 py-6 md:px-8 items-center"
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full max-w-2xl gap-5">
          {step === 1 && (
            <>
              <AppText weight="semibold" className="text-base text-slate-900">
                {t("batchForm.select_farmer_title")}
              </AppText>
              <View className="flex-row items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5">
                <Search size={16} color="#94a3b8" />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t("batchForm.farmer_search_placeholder")}
                  placeholderTextColor="#94a3b8"
                  className="font-bn min-h-[48px] flex-1 text-[15px] text-slate-900"
                />
              </View>

              {farmersLoading ? (
                <AppText className="py-6 text-center text-xs text-slate-400">
                  কৃষক তালিকা লোড হচ্ছে...
                </AppText>
              ) : farmers.length === 0 ? (
                <View className="items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white p-6">
                  <AppText className="text-center text-sm text-slate-500">
                    এখনও কোনো কৃষক নিবন্ধিত হয়নি। ব্যাচ তৈরির আগে একজন কৃষক নিবন্ধন করুন।
                  </AppText>
                  <Button variant="secondary" onPress={() => router.push("/farmer/new")}>
                    নতুন কৃষক নিবন্ধন করুন
                  </Button>
                </View>
              ) : (
                <View className="gap-2.5">
                  {filteredFarmers.map((f) => {
                    const selected = f.id === form.farmerId;
                    return (
                      <Pressable
                        key={f.id}
                        onPress={() => update({ farmerId: f.id })}
                        className={`flex-row items-center gap-3 rounded-2xl border p-3.5 ${
                          selected ? "border-brand-400 bg-brand-50" : "border-slate-100 bg-white"
                        }`}
                      >
                        <Avatar name={f.name} size="sm" />
                        <View className="flex-1">
                          <AppText weight="medium" className="text-sm text-slate-900">
                            {f.name}
                          </AppText>
                          <AppText className="mt-0.5 text-xs text-slate-400">
                            {f.village} · {f.crop}
                          </AppText>
                        </View>
                        {selected && <CheckCircle2 size={20} color="#256b3f" />}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <View>
                <AppText weight="medium" className="mb-2 text-sm text-slate-700">
                  {t("batchForm.crop_label")}
                </AppText>
                <ChipSelect options={cropOptions} value={form.crop} onChange={(v) => update({ crop: v as string })} />
              </View>

              <Input
                label={t("batchForm.quantity_label")}
                placeholder={t("batchForm.quantity_placeholder")}
                keyboardType="number-pad"
                value={form.quantity}
                onChangeText={(v) => update({ quantity: v })}
                icon={<Weight size={18} color="#94a3b8" />}
              />

              <View>
                <AppText weight="medium" className="mb-2 text-sm text-slate-700">
                  {t("batchForm.harvest_label")}
                </AppText>
                <ChipSelect
                  options={[t("batchForm.today"), t("batchForm.yesterday"), t("batchForm.custom_date")]}
                  value={form.harvestOption}
                  onChange={(v) => update({ harvestOption: v as string })}
                />
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <View>
                <AppText weight="semibold" className="text-base text-slate-900">
                  {t("batchForm.inputs_title")}
                </AppText>
                <AppText className="mt-1 text-sm text-slate-400">{t("batchForm.inputs_subtitle")}</AppText>
              </View>
              <ChipSelect options={inputOptions} value={form.inputs} onChange={(v) => update({ inputs: v as string[] })} multi />

              <Input
                label={t("batchForm.notes_label")}
                placeholder={t("batchForm.notes_placeholder")}
                value={form.notes}
                onChangeText={(v) => update({ notes: v })}
                multiline
                numberOfLines={3}
                className="min-h-[80px] py-3"
              />
            </>
          )}

          {step === 4 && (
            <>
              <AppText weight="semibold" className="text-base text-slate-900">
                {t("batchForm.review_title")}
              </AppText>

              <Card className="gap-3">
                <ReviewRow label={t("batches.title")} value={selectedFarmer?.name ?? ""} />
                <ReviewRow label={t("batchForm.crop_label")} value={form.crop} />
                <ReviewRow label={t("batchForm.quantity_label")} value={`${form.quantity} kg`} />
                <ReviewRow label={t("batchForm.harvest_label")} value={form.harvestOption} />
              </Card>

              <Card className="gap-2">
                <AppText className="text-xs text-slate-400">{t("batchForm.inputs_title")}</AppText>
                <View className="flex-row flex-wrap gap-2">
                  {form.inputs.map((i) => (
                    <View key={i} className="rounded-full bg-slate-100 px-3 py-1">
                      <AppText className="text-xs text-slate-600">{i}</AppText>
                    </View>
                  ))}
                </View>
                {form.notes ? <AppText className="mt-1 text-sm text-slate-600">{form.notes}</AppText> : null}
              </Card>
            </>
          )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <WizardFooter
        onBack={handleBack}
        onNext={() => {
          if (step === 4) handleGenerate();
          else setStep((s) => s + 1);
        }}
        showBack={step > 1}
        backLabel={t("batchForm.back_button")}
        nextLabel={step === 4 ? t("batchForm.generate_button") : t("batchForm.next_button")}
        nextDisabled={
          (step === 1 && !step1Valid) || (step === 2 && !step2Valid) || (step === 3 && !step3Valid)
        }
        loading={submitting}
      />
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <AppText className="text-xs text-slate-400">{label}</AppText>
      <AppText weight="medium" className="text-sm text-slate-800">
        {value}
      </AppText>
    </View>
  );
}

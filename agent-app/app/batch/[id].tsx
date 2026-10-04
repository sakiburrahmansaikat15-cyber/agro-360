import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Printer, Share2, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, View, ActivityIndicator } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { AppText } from "@/components/ui/AppText";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useT } from "@/lib/i18n/context";
import { getDb } from "@/lib/db";
import { supabase } from "@/lib/supabase";

export default function BatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const router = useRouter();
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBatchDetail() {
      if (!id) return;
      try {
        if (supabase) {
          const { data } = await supabase.from("batches").select("*").eq("id", id).maybeSingle();
          if (data) {
            setBatch({
              id: data.id,
              farmerId: data.farmer_id || "",
              farmerName: data.farmerName || "কৃষক",
              crop: data.crop || "ধান",
              quantityKg: Number(data.quantityKg) || 0,
              harvestDate: data.harvestDate || "",
              inputs: Array.isArray(data.inputs) ? data.inputs : [],
              synced: true,
            });
            setLoading(false);
            return;
          }
        }

        const db = await getDb();
        const localData = await db.getFirstAsync<any>("SELECT * FROM batches WHERE id = ?", [id]);
        if (localData) {
          setBatch({
            id: localData.id,
            farmerId: localData.farmerId,
            farmerName: localData.farmerName,
            crop: localData.crop,
            quantityKg: localData.quantityKg,
            harvestDate: localData.harvestDate,
            inputs: localData.inputs ? JSON.parse(localData.inputs) : [],
            synced: localData.sync_status === "SYNCED",
          });
        }
      } catch (err) {
        console.error("Batch detail error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBatchDetail();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator size="large" color="#166534" />
      </View>
    );
  }

  if (!batch) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-canvas">
        <AppText className="text-slate-400">ব্যাচের তথ্য পাওয়া যায়নি (Batch not found)</AppText>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-canvas" contentContainerClassName="gap-4 p-5">
      <Stack.Screen options={{ title: batch.id }} />

      <Card className="items-center py-6">
        <QRCode value={batch.id} size={160} color="#122e1e" backgroundColor="white" />
        <AppText weight="bold" className="mt-4 font-mono text-base text-slate-900">
          {batch.id}
        </AppText>
        <View className="mt-2">
          <Badge
            tone={batch.synced ? "success" : "warning"}
            label={batch.synced ? t("batches.status_tagged") : t("batches.status_pending")}
          />
        </View>
      </Card>

      {batch.farmerId ? (
        <Pressable onPress={() => router.push({ pathname: "/farmer/[id]", params: { id: batch.farmerId } })}>
          <Card className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-100">
              <User size={18} color="#256b3f" />
            </View>
            <View className="flex-1">
              <AppText className="text-xs text-slate-400">{t("common.farmer")}</AppText>
              <AppText weight="medium" className="text-sm text-slate-900">
                {batch.farmerName}
              </AppText>
            </View>
          </Card>
        </Pressable>
      ) : null}

      <Card className="gap-3">
        <ReviewRow label={t("batchForm.crop_label")} value={batch.crop} />
        <ReviewRow label={t("batchForm.quantity_label")} value={`${batch.quantityKg} kg`} />
        <ReviewRow label={t("batchForm.harvest_label")} value={batch.harvestDate} />
      </Card>

      {batch.inputs && batch.inputs.length > 0 ? (
        <Card className="gap-2">
          <AppText className="text-xs text-slate-400">{t("batchForm.inputs_title")}</AppText>
          <View className="flex-row flex-wrap gap-2">
            {batch.inputs.map((i: string) => (
              <View key={i} className="rounded-full bg-slate-100 px-3 py-1">
                <AppText className="text-xs text-slate-600">{i}</AppText>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Button variant="secondary" icon={<Printer size={16} color="#256b3f" />} onPress={() => {}}>
            {t("batchForm.print_button")}
          </Button>
        </View>
        <View className="flex-1">
          <Button variant="secondary" icon={<Share2 size={16} color="#256b3f" />} onPress={() => {}}>
            {t("batchForm.share_button")}
          </Button>
        </View>
      </View>
    </ScrollView>
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

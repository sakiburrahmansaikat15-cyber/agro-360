import { Stack, useLocalSearchParams } from "expo-router";
import { MapPin, Phone, Sprout, Wallet } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ScrollView, View, ActivityIndicator } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useLanguage, useT } from "@/lib/i18n/context";
import { getDb } from "@/lib/db";
import { supabase } from "@/lib/supabase";

export default function FarmerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const [farmer, setFarmer] = useState<any>(null);
  const [farmerBatches, setFarmerBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFarmerDetail() {
      if (!id) return;
      try {
        // Try live Supabase query first
        if (supabase) {
          const { data } = await supabase.from("farmers").select("*").eq("id", id).maybeSingle();
          if (data) {
            setFarmer({
              id: data.id,
              name: data.name || "কৃষক",
              phone: data.phone || "-",
              village: data.village || "গ্রাম",
              union: data.union_name || "ইউনিয়ন",
              landDecimal: Number(data.landDecimal) || 0,
              crop: data.crop || "ধান",
              hasWallet: !!data.hasWallet,
              synced: true,
            });
            setLoading(false);
            return;
          }
        }

        // SQLite fallback
        const db = await getDb();
        const localData = await db.getFirstAsync<any>("SELECT * FROM farmers WHERE id = ?", [id]);
        if (localData) {
          setFarmer({
            id: localData.id,
            name: localData.name,
            phone: localData.phone,
            village: localData.village,
            union: localData.union_name,
            landDecimal: localData.landDecimal,
            crop: localData.crop,
            hasWallet: !!localData.hasWallet,
            synced: localData.sync_status === "SYNCED",
          });
        }
      } catch (err) {
        console.error("Farmer detail error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFarmerDetail();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator size="large" color="#166534" />
      </View>
    );
  }

  if (!farmer) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-canvas">
        <AppText className="text-slate-400">কৃষকের তথ্য পাওয়া যায়নি (Farmer not found)</AppText>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-canvas" contentContainerClassName="gap-4 p-5">
      <Stack.Screen options={{ title: farmer.name }} />

      <Card className="items-center py-6">
        <Avatar name={farmer.name} size="lg" />
        <AppText weight="bold" className="mt-3 text-lg text-slate-900">
          {farmer.name}
        </AppText>
        <AppText className="mt-0.5 text-sm text-slate-400">{farmer.id}</AppText>
        <View className="mt-3">
          <Badge
            tone={farmer.synced ? "success" : "warning"}
            label={farmer.synced ? t("farmers.status_synced") : t("farmers.status_pending")}
          />
        </View>
      </Card>

      <Card className="gap-4">
        <InfoRow icon={<Phone size={16} color="#64748b" />} label={t("farmerForm.phone_label")} value={farmer.phone} />
        <InfoRow icon={<MapPin size={16} color="#64748b" />} label={t("farmerForm.union_label")} value={`${farmer.village}, ${farmer.union}`} />
        <InfoRow icon={<Sprout size={16} color="#64748b" />} label={t("farmers.crop")} value={farmer.crop} />
        <InfoRow icon={<Sprout size={16} color="#64748b" />} label={t("farmerForm.land_label")} value={`${farmer.landDecimal} ${t("farmers.decimal")}`} />
        <InfoRow icon={<Wallet size={16} color="#64748b" />} label={t("farmerForm.wallet_option")} value={farmer.hasWallet ? t("farmers.wallet_yes") : t("farmers.wallet_no")} />
      </Card>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
      <View className="flex-row items-center gap-2.5">
        <View className="h-8 w-8 items-center justify-center rounded-lg bg-slate-100">{icon}</View>
        <AppText className="text-xs text-slate-500">{label}</AppText>
      </View>
      <AppText weight="semibold" className="text-sm text-slate-900">
        {value}
      </AppText>
    </View>
  );
}

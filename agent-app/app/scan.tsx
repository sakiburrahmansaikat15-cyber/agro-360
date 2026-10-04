import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { X, QrCode, Search, AlertCircle } from 'lucide-react-native';
import { useState } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { useT } from '@/lib/i18n/context';
import { supabase } from '@/lib/supabase';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [looking, setLooking] = useState(false);
  const [notFound, setNotFound] = useState<string | null>(null);
  const router = useRouter();
  const t = useT();

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-black px-6">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-white/10 mb-6">
          <QrCode size={40} color="white" />
        </View>
        <AppText weight="bold" className="text-xl text-white mb-2 text-center">
          Camera Access Required
        </AppText>
        <AppText className="text-center text-slate-400 mb-8">
          We need your permission to show the camera to scan batch QR codes.
        </AppText>
        <Button onPress={requestPermission} variant="primary" className="w-full">
          Grant Permission
        </Button>
      </SafeAreaView>
    );
  }

  // Looks the scanned code up against batches first, then farmers, matching
  // either the real uuid primary key or the printed display_id — previously
  // this just alert()'d the raw scanned string and never queried anything,
  // so scanning never actually opened the corresponding record.
  const handleBarcodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    setNotFound(null);
    setLooking(true);

    const code = data.trim();

    try {
      if (supabase && code) {
        const { data: batch } = await supabase
          .from('batches')
          .select('id')
          .or(`id.eq.${code},display_id.eq.${code}`)
          .maybeSingle();

        if (batch?.id) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace({ pathname: '/batch/[id]', params: { id: batch.id } });
          return;
        }

        const { data: farmer } = await supabase
          .from('farmers')
          .select('id')
          .or(`id.eq.${code},display_id.eq.${code}`)
          .maybeSingle();

        if (farmer?.id) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace({ pathname: '/farmer/[id]', params: { id: farmer.id } });
          return;
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setNotFound(code);
    } catch (err) {
      console.error('QR lookup failed:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setNotFound(code);
    } finally {
      setLooking(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />
      <SafeAreaView className="flex-1 justify-between">
        <View className="flex-row justify-end p-4">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-black/50"
          >
            <X size={24} color="white" />
          </Pressable>
        </View>

        <View className="items-center pb-12 px-6">
          <View className="h-64 w-64 rounded-3xl border-2 border-brand-400/50 bg-black/20 mb-8" />

          {looking ? (
            <View className="flex-row items-center gap-2 rounded-full bg-black/60 px-6 py-3">
              <ActivityIndicator color="#ffffff" size="small" />
              <AppText weight="medium" className="text-white text-sm text-center">
                খোঁজা হচ্ছে...
              </AppText>
            </View>
          ) : notFound ? (
            <View className="w-full items-center gap-3 rounded-2xl bg-black/70 px-5 py-4">
              <View className="flex-row items-center gap-2">
                <AlertCircle size={16} color="#f87171" />
                <AppText weight="semibold" className="text-white text-sm text-center">
                  কোনো ব্যাচ বা কৃষক পাওয়া যায়নি
                </AppText>
              </View>
              <AppText className="text-slate-400 text-xs text-center">Scanned: {notFound}</AppText>
              <Button
                variant="secondary"
                icon={<Search size={14} color="#256b3f" />}
                onPress={() => {
                  setScanned(false);
                  setNotFound(null);
                }}
              >
                আবার চেষ্টা করুন
              </Button>
            </View>
          ) : (
            <View className="rounded-full bg-black/60 px-6 py-3">
              <AppText weight="medium" className="text-white text-sm text-center">
                Point your camera at a batch or farmer QR code
              </AppText>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

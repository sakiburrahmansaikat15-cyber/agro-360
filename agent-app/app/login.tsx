import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Leaf, Lock, Phone, Wifi } from "lucide-react-native";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLanguage, useT } from "@/lib/i18n/context";
import { useUser } from "@/lib/context/UserContext";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const t = useT();
  const { locale, toggleLocale } = useLanguage();
  const router = useRouter();
  const { refreshProfile } = useUser();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert(
        "লগইন ব্যর্থ | Login Failed",
        "ফোন নম্বর এবং পাসওয়ার্ড লিখুন।\nPlease enter phone number and password."
      );
      return;
    }

    setLoading(true);

    try {
      if (!supabase) {
        Alert.alert(
          "সংযোগ ত্রুটি | Config Error",
          "Supabase is NOT configured in the agent app.\n\nURL: " + (process.env.EXPO_PUBLIC_SUPABASE_URL || "MISSING") + "\n\nPlease restart the Expo server with: expo start --clear"
        );
        setLoading(false);
        return;
      }

      // Sanitize phone: remove +, spaces, dashes — must match exactly what admin panel creates
      const sanitizedPhone = phone.trim().replace(/[^a-zA-Z0-9]/g, '');
      const email = `${sanitizedPhone}@agro-trust.com`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password.trim(),
      });

      if (error) {
        // Show exact error with the email being used for easy debugging
        Alert.alert(
          "লগইন ব্যর্থ | Login Failed",
          `Error: ${error.message}\n\nEmail tried: ${email}\n\nCommon fixes:\n• Check phone & password\n• Supabase URL: ${process.env.EXPO_PUBLIC_SUPABASE_URL?.substring(0, 30)}...`
        );
      } else if (data.session) {
        await refreshProfile();
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert("সংযোগ ত্রুটি", `Error: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#0f1c15", "#163824", "#1d5334"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="flex-1">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
          <Pressable
            onPress={toggleLocale}
            className="absolute right-5 top-4 z-10 rounded-full border border-white/10 bg-white/10 px-4 py-2"
          >
            <AppText weight="semibold" className="text-xs text-white">
              {locale === "bn" ? "বাংলা" : "EN"}
            </AppText>
          </Pressable>

          <View className="flex-1 items-center justify-center px-6">
            <View className="mb-8 items-center">
              <View className="h-20 w-20 items-center justify-center rounded-[26px] bg-white/10 border border-white/10 shadow-lg">
                <LinearGradient
                  colors={["#6cc088", "#256b3f"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="h-16 w-16 items-center justify-center rounded-[20px]"
                >
                  <Leaf color="white" size={32} />
                </LinearGradient>
              </View>

              <AppText weight="bold" className="mt-5 text-3xl text-white tracking-tight">
                {t("brand.name")}
              </AppText>
              <View className="mt-2 rounded-full border border-brand-400/30 bg-brand-500/20 px-4 py-1.5">
                <AppText weight="medium" className="text-xs tracking-wide text-brand-100 uppercase">
                  {t("brand.role")}
                </AppText>
              </View>
            </View>

            <BlurView intensity={20} tint="dark" className="w-full overflow-hidden rounded-3xl border border-white/10 bg-black/20 p-6">
              <AppText weight="bold" className="text-xl text-white">
                {t("auth.welcome")}
              </AppText>
              <AppText className="mt-1 text-sm text-slate-300">
                {t("auth.subtitle")}
              </AppText>

              <View className="mt-6 gap-5">
                <Input
                  label={t("auth.phone_label")}
                  placeholder="01712345678"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  autoCorrect={false}
                  icon={<Phone size={18} color="#94a3b8" />}
                />
                <Input
                  label="পাসওয়ার্ড | Password"
                  placeholder="আপনার পাসওয়ার্ড লিখুন"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  autoCorrect={false}
                  icon={<Lock size={18} color="#94a3b8" />}
                />
              </View>

              <View className="mt-6">
                <Button onPress={handleLogin} loading={loading} size="lg" variant="primary">
                  {t("auth.login_button")}
                </Button>
              </View>

              <View className="mt-5 flex-row items-center justify-center gap-2 rounded-full border border-white/5 bg-white/5 py-3">
                <Wifi size={14} color="#6cc088" />
                <AppText weight="medium" className="text-xs text-brand-200">
                  {t("auth.offline_ready")}
                </AppText>
              </View>
            </BlurView>

            <AppText className="mt-8 text-center text-xs text-slate-400/60" weight="medium">
              {t("auth.help")}
            </AppText>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

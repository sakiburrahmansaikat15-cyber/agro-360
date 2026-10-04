import "../global.css";
import "@/lib/nativewind-interop";

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  NotoSansBengali_400Regular,
  NotoSansBengali_500Medium,
  NotoSansBengali_600SemiBold,
  NotoSansBengali_700Bold,
} from "@expo-google-fonts/noto-sans-bengali";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { LanguageProvider } from "@/lib/i18n/context";
import { UserProvider } from "@/lib/context/UserContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "login",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    NotoSansBengali_400Regular,
    NotoSansBengali_500Medium,
    NotoSansBengali_600SemiBold,
    NotoSansBengali_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <LanguageProvider>
        <Stack screenOptions={{ headerShadowVisible: false }}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="farmer/new"
            options={{ presentation: "modal", headerShown: false }}
          />
          <Stack.Screen
            name="farmer/[id]"
            options={{
              title: "",
              headerStyle: { backgroundColor: "#f6f8f6" },
              headerTintColor: "#122e1e",
            }}
          />
          <Stack.Screen
            name="scan"
            options={{ presentation: "fullScreenModal", headerShown: false }}
          />
          <Stack.Screen
            name="batch/new"
            options={{ presentation: "modal", headerShown: false }}
          />
          <Stack.Screen
            name="batch/[id]"
            options={{
              title: "",
              headerStyle: { backgroundColor: "#f6f8f6" },
              headerTintColor: "#122e1e",
            }}
          />
        </Stack>
      </LanguageProvider>
    </UserProvider>
    </QueryClientProvider>
  );
}

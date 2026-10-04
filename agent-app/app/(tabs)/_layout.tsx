import { Tabs } from "expo-router";

import { FloatingTabBar } from "@/components/layout/FloatingTabBar";
import { useT } from "@/lib/i18n/context";
import { useSyncQueue } from "@/lib/hooks/useSyncQueue";

export default function TabLayout() {
  const t = useT();
  // Drives automatic retry of any farmer/batch registered while offline —
  // runs on mount, on app foreground, and every 30s. See useSyncQueue.ts.
  useSyncQueue();

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <FloatingTabBar
          state={props.state}
          descriptors={props.descriptors}
          navigation={props.navigation}
        />
      )}
    >
      <Tabs.Screen name="index" options={{ title: t("nav.home") }} />
      <Tabs.Screen name="tasks" options={{ title: "Tasks" }} />
      <Tabs.Screen name="farmers" options={{ title: t("farmers.title") }} />
      <Tabs.Screen name="batches" options={{ title: t("batches.title") }} />
      <Tabs.Screen name="profile" options={{ title: t("profile.title") }} />
    </Tabs>
  );
}

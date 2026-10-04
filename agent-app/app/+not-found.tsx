import { Link, Stack } from "expo-router";
import { View } from "react-native";

import { AppText } from "@/components/ui/AppText";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "" }} />
      <View className="flex-1 items-center justify-center bg-[#f6f8f6] p-5">
        <AppText weight="semibold" className="text-lg text-slate-800">
          This screen doesn&apos;t exist.
        </AppText>

        <Link href="/" className="mt-4 py-4">
          <AppText weight="medium" className="text-sm text-brand-600">
            Go to home screen!
          </AppText>
        </Link>
      </View>
    </>
  );
}

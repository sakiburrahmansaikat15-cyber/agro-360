import { type ReactNode } from "react";
import { View } from "react-native";
import { AppText } from "./AppText";

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <View className="items-center px-8 py-16">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-brand-50">{icon}</View>
      <AppText weight="semibold" className="text-center text-base text-slate-800">
        {title}
      </AppText>
      <AppText className="mt-1.5 text-center text-sm text-slate-400">{subtitle}</AppText>
    </View>
  );
}

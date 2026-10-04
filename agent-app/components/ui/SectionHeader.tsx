import { type ReactNode } from "react";
import { View } from "react-native";
import { AppText } from "./AppText";

export function SectionHeader({
  icon,
  title,
  trailing,
}: {
  icon?: ReactNode;
  title: string;
  trailing?: ReactNode;
}) {
  return (
    <View className="mb-4 flex-row items-center justify-between">
      <View className="flex-row items-center gap-2.5">
        {icon && (
          <View
            className="h-7 w-7 items-center justify-center rounded-lg bg-brand-50"
            style={{ transform: [{ rotate: "-8deg" }] }}
          >
            {icon}
          </View>
        )}
        <AppText weight="bold" className="text-base text-slate-900">
          {title}
        </AppText>
      </View>
      {trailing}
    </View>
  );
}

import { type ReactNode } from "react";
import { View } from "react-native";
import { AppText } from "./AppText";
import { Extruded } from "./Extruded";
import { GradientTile } from "./GradientTile";

const tones = {
  brand: { base: "#cfe7d6", preset: "green" as const },
  teal: { base: "#c2ebe7", preset: "teal" as const },
  honey: { base: "#f6ddad", preset: "honey" as const },
};

export function StatCard({
  icon,
  value,
  label,
  tone = "brand",
}: {
  icon: ReactNode;
  value: string;
  label: string;
  tone?: keyof typeof tones;
}) {
  const t = tones[tone];
  return (
    <Extruded baseColor={t.base} depth={5} radius={24} style={{ flex: 1 }}>
      <View className="p-4">
        <GradientTile preset={t.preset} size="sm">
          {icon}
        </GradientTile>
        <AppText weight="bold" className="mt-3 text-2xl text-slate-900">
          {value}
        </AppText>
        <AppText weight="medium" className="mt-0.5 text-[11px] leading-tight text-slate-400">
          {label}
        </AppText>
      </View>
    </Extruded>
  );
}

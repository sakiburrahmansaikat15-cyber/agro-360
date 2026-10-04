import { View } from "react-native";
import { AppText } from "./AppText";

export function ProgressSteps({ total, current, label }: { total: number; current: number; label: string }) {
  return (
    <View>
      <View className="flex-row gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} className={`h-1.5 flex-1 rounded-full ${i < current ? "bg-brand-500" : "bg-slate-100"}`} />
        ))}
      </View>
      <AppText weight="medium" className="mt-2.5 text-xs text-slate-400">
        {label}
      </AppText>
    </View>
  );
}

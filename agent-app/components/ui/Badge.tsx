import { View } from "react-native";
import { AppText } from "./AppText";

type Tone = "success" | "warning" | "neutral" | "info" | "danger";

const toneStyles: Record<Tone, { bg: string; text: string; dot: string }> = {
  success: { bg: "bg-brand-50", text: "text-brand-700", dot: "bg-brand-500" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  neutral: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },
  info: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
  danger: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
};

export function Badge({ tone = "neutral", label, dot = true }: { tone?: Tone; label: string; dot?: boolean }) {
  const t = toneStyles[tone];
  return (
    <View className={`flex-row items-center gap-1.5 self-start rounded-full px-2.5 py-1 ${t.bg}`}>
      {dot && <View className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />}
      <AppText weight="medium" className={`text-xs ${t.text}`}>
        {label}
      </AppText>
    </View>
  );
}

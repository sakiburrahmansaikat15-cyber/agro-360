import { Pressable, View } from "react-native";
import { Check } from "lucide-react-native";
import { AppText } from "@/components/ui/AppText";

export function ChipSelect({
  options,
  value,
  onChange,
  multi = false,
}: {
  options: string[];
  value: string | string[];
  onChange: (next: string | string[]) => void;
  multi?: boolean;
}) {
  const isSelected = (opt: string) => (multi ? (value as string[]).includes(opt) : value === opt);

  const handlePress = (opt: string) => {
    if (multi) {
      const current = value as string[];
      onChange(current.includes(opt) ? current.filter((o) => o !== opt) : [...current, opt]);
    } else {
      onChange(opt);
    }
  };

  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => {
        const selected = isSelected(opt);
        return (
          <Pressable
            key={opt}
            onPress={() => handlePress(opt)}
            className={`flex-row items-center gap-1.5 rounded-full border px-4 py-2.5 transition-all ${
              selected
                ? "border-brand-600 bg-brand-50 shadow-sm"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            {selected && (
              <View className="h-4 w-4 items-center justify-center rounded-full bg-brand-600">
                <Check size={10} color="#ffffff" strokeWidth={3} />
              </View>
            )}
            <AppText
              weight={selected ? "semibold" : "medium"}
              className={`text-sm ${selected ? "text-brand-800" : "text-slate-600"}`}
            >
              {opt}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}


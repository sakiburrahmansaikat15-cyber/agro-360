import { useState, type ReactNode } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { AppText } from "./AppText";

export function Input({
  label,
  sublabel,
  icon,
  className,
  ...props
}: TextInputProps & { label?: string; sublabel?: string; icon?: ReactNode; className?: string }) {
  const [focused, setFocused] = useState(false);

  return (
    <View>
      {label && (
        <AppText weight="medium" className="mb-1.5 text-sm text-slate-700">
          {label}
        </AppText>
      )}
      <View
        className={`flex-row items-center gap-2 rounded-xl border bg-slate-50 px-3.5 ${
          focused ? "border-brand-400 bg-white" : "border-slate-200"
        }`}
      >
        {icon}
        <TextInput
          className={`font-bn min-h-[50px] flex-1 text-[15px] text-slate-900 ${className ?? ""}`}
          placeholderTextColor="#94a3b8"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </View>
      {sublabel && <AppText className="mt-1.5 text-xs text-slate-400">{sublabel}</AppText>}
    </View>
  );
}

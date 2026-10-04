import { Text, type TextProps } from "react-native";
import { useLanguage } from "@/lib/i18n/context";

type Weight = "regular" | "medium" | "semibold" | "bold";

const fontMap: Record<"bn" | "en", Record<Weight, string>> = {
  bn: {
    regular: "font-bn",
    medium: "font-bn-medium",
    semibold: "font-bn-semibold",
    bold: "font-bn-bold",
  },
  en: {
    regular: "font-sans",
    medium: "font-sans-medium",
    semibold: "font-sans-semibold",
    bold: "font-sans-bold",
  },
};

export function AppText({
  weight = "regular",
  className,
  ...props
}: TextProps & { weight?: Weight; className?: string }) {
  const { locale } = useLanguage();
  const fontClass = fontMap[locale][weight];
  return <Text className={`${fontClass} ${className ?? ""}`} {...props} />;
}

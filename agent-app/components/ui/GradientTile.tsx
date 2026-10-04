import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode } from "react";
import { View } from "react-native";

type Preset = "green" | "teal" | "honey" | "rose";

const gradients: Record<Preset, [string, string]> = {
  green: ["#3a9e5f", "#1e5534"],
  teal: ["#3fb6b0", "#1a6262"],
  honey: ["#edb654", "#cf8712"],
  rose: ["#fb7185", "#be123c"],
};

const sizeMap = {
  sm: "h-9 w-9 rounded-xl",
  md: "h-11 w-11 rounded-2xl",
  lg: "h-14 w-14 rounded-[20px]",
};

export function GradientTile({
  children,
  preset = "green",
  size = "md",
}: {
  children: ReactNode;
  preset?: Preset;
  size?: keyof typeof sizeMap;
}) {
  return (
    <LinearGradient
      colors={gradients[preset]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className={`items-center justify-center overflow-hidden ${sizeMap[size]}`}
    >
      {/* glossy top highlight for a 3D glass feel */}
      <View
        style={{
          pointerEvents: "none" as any,
          position: "absolute",
          top: 2,
          left: 5,
          right: 5,
          height: "34%",
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.28)",
        }}
      />
      {children}
    </LinearGradient>
  );
}

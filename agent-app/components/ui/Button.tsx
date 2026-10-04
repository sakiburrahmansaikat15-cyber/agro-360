import { type ReactNode } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { AppText } from "./AppText";
import { Extruded } from "./Extruded";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const flatVariants: Record<Exclude<Variant, "primary">, { container: string; text: string }> = {
  secondary: { container: "bg-white border border-slate-200", text: "text-brand-700" },
  ghost: { container: "bg-transparent", text: "text-brand-700" },
  danger: { container: "bg-red-50", text: "text-red-600" },
};

const sizeStyles: Record<Size, { container: string; text: string }> = {
  md: { container: "px-4 py-3.5", text: "text-[15px]" },
  lg: { container: "px-5 py-4", text: "text-base" },
};

export function Button({
  children,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  loading,
  disabled,
  fullWidth = true,
  className,
}: {
  children: ReactNode;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isDisabled = disabled || loading;
  const s = sizeStyles[size];

  // Primary variant renders via Extruded, which already fires haptics on
  // press-in for every consumer — no need to duplicate that here. The flat
  // variants below (secondary/ghost/danger) use a plain AnimatedPressable
  // instead, so they get their own tactile buzz via handlePress.
  const handlePress = () => {
    if (isDisabled) return;
    Haptics.impactAsync(
      variant === "danger" ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
    );
    onPress?.();
  };

  // Primary: a physical 3D button — green face on a darker base edge,
  // pressing pushes the face down onto the base.
  if (variant === "primary") {
    return (
      <Extruded
        onPress={isDisabled ? undefined : onPress}
        depth={4}
        radius={16}
        baseColor="#12331f"
        faceColor="#256b3f"
        style={[fullWidth ? { width: "100%" } : null, isDisabled ? { opacity: 0.55 } : null]}
      >
        <View className={`flex-row items-center justify-center gap-2 ${s.container} ${className ?? ""}`}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              {icon && <View>{icon}</View>}
              <AppText weight="semibold" className={`${s.text} text-white`}>
                {children}
              </AppText>
            </>
          )}
        </View>
      </Extruded>
    );
  }

  const v = flatVariants[variant];

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={isDisabled}
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 120 });
      }}
      style={animatedStyle}
      className={`flex-row items-center justify-center gap-2 rounded-2xl ${s.container} ${v.container} ${
        isDisabled ? "opacity-50" : ""
      } ${fullWidth ? "w-full" : ""} ${className ?? ""}`}
    >
      {loading ? (
        <ActivityIndicator color="#256b3f" />
      ) : (
        <>
          {icon && <View>{icon}</View>}
          <AppText weight="semibold" className={`${s.text} ${v.text}`}>
            {children}
          </AppText>
        </>
      )}
    </AnimatedPressable>
  );
}

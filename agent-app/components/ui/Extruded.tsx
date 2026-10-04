import { type ReactNode } from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

/**
 * A physically "extruded" 3D surface: the face sits on a darker base edge,
 * and pressing pushes the face down onto the base like a real button.
 * Pure layered Views — no absolute overlap with outside content.
 */
export function Extruded({
  children,
  onPress,
  depth = 5,
  radius = 24,
  baseColor,
  faceColor = "#ffffff",
  faceStyle,
  disabled,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  depth?: number;
  radius?: number;
  baseColor: string;
  faceColor?: string;
  faceStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const pressed = useSharedValue(0);
  const faceAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * depth }],
  }));

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      onPressIn={() => {
        // Tactile feedback the instant the press registers, before the
        // face finishes animating down — feels snappier than firing on
        // release. Covers every Extruded consumer (primary Button, home
        // quick-action tiles, StatCard) from this one spot.
        if (onPress) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        pressed.value = withTiming(1, { duration: 70 });
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, { duration: 110 });
      }}
      style={[{ paddingBottom: depth }, style]}
    >
      {/* base (the 3D edge) */}
      <View
        style={{
          pointerEvents: "none" as any,
          position: "absolute",
          left: 0,
          right: 0,
          top: depth,
          bottom: 0,
          backgroundColor: baseColor,
          borderRadius: radius,
        }}
      />
      {/* face */}
      <Animated.View
        style={[{ borderRadius: radius, backgroundColor: faceColor, overflow: "hidden" }, faceAnim, faceStyle]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

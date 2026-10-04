import { type ReactNode } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedPressCard({
  children,
  onPress,
  className,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  className?: string;
  // Previously missing from the prop type: farmers.tsx and batches.tsx were
  // already passing a `style` object (card background/radius/shadow) that
  // silently had no effect at runtime because it was never forwarded to the
  // underlying Pressable — TS caught this as a real type error, not just
  // noise. Now accepted and merged with the press-scale animated style.
  style?: StyleProp<ViewStyle>;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        // Subtle selection tick (lighter than Button's impact haptic) —
        // this wraps every farmer/batch list row, so it needs to stay
        // gentle rather than buzzy at high tap frequency.
        if (onPress) Haptics.selectionAsync();
        scale.value = withTiming(0.96, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 120 });
      }}
      style={[style, animatedStyle]}
      className={className}
    >
      {children}
    </AnimatedPressable>
  );
}

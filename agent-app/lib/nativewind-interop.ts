import { LinearGradient } from "expo-linear-gradient";
import { cssInterop } from "nativewind";

// expo-linear-gradient's LinearGradient is a third-party component, so NativeWind
// does not automatically convert `className` into a `style`. Register it once here
// so gradient heroes/tiles receive their padding, sizing, and border-radius classes.
cssInterop(LinearGradient, { className: "style" });

import { View, type ViewProps } from "react-native";

export function Card({ children, className, ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={`rounded-3xl bg-white p-5 ${className ?? ""}`}
      style={{
        boxShadow: "0px 6px 16px rgba(18, 46, 30, 0.07)",
      }}
      {...props}
    >
      {children}
    </View>
  );
}

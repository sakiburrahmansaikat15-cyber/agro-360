import { View } from "react-native";
import { AppText } from "./AppText";

const palettes = [
  { bg: "bg-brand-100", text: "text-brand-700" },
  { bg: "bg-teal-100", text: "text-teal-700" },
  { bg: "bg-honey-100", text: "text-honey-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-indigo-100", text: "text-indigo-700" },
  { bg: "bg-sky-100", text: "text-sky-700" },
];

function paletteFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i)) % palettes.length;
  return palettes[hash];
}

const sizeMap = {
  sm: { box: "h-10 w-10", text: "text-sm" },
  md: { box: "h-11 w-11", text: "text-base" },
  lg: { box: "h-16 w-16", text: "text-xl" },
};

export function Avatar({ name, size = "md" }: { name: string; size?: keyof typeof sizeMap }) {
  const p = paletteFor(name);
  const s = sizeMap[size];
  return (
    <View className={`items-center justify-center rounded-full ${p.bg} ${s.box}`}>
      <AppText weight="bold" className={`${p.text} ${s.text}`}>
        {name.trim().charAt(0)}
      </AppText>
    </View>
  );
}

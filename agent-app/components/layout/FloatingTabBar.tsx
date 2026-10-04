import { CheckSquare, Home, QrCode, UserRound, Users, type LucideIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { AppText } from "@/components/ui/AppText";

const icons: Record<string, LucideIcon> = {
  index: Home,
  tasks: CheckSquare,
  farmers: Users,
  batches: QrCode,
  profile: UserRound,
};

type TabBarProps = {
  state: {
    index: number;
    routes: { key: string; name: string }[];
  };
  descriptors: Record<string, { options: { title?: string } }>;
  navigation: {
    emit: (event: { type: "tabPress"; target: string; canPreventDefault: true }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string) => void;
  };
};

export function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  return (
    <View className="absolute inset-x-0 bottom-0 items-center pointer-events-none" pointerEvents="box-none">
      <SafeAreaView edges={["bottom"]} className="w-full max-w-lg pointer-events-auto">
        <View
          className="mx-4 mb-3 flex-row items-center justify-around rounded-full bg-white px-2 py-2"
          style={{
            boxShadow: "0px 10px 30px rgba(18, 46, 30, 0.15)",
            elevation: 16,
          }}
        >
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const Icon = icons[route.name] ?? Home;
            const label = (descriptors[route.key].options.title as string) ?? route.name;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                Haptics.selectionAsync();
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable key={route.key} onPress={onPress} className="flex-1 items-center">
                <View
                  className={`w-full items-center rounded-full py-2 ${focused ? "bg-brand-50" : "bg-transparent"}`}
                >
                  <Icon size={20} color={focused ? "#15803d" : "#94a3b8"} strokeWidth={focused ? 2.5 : 2} />
                  <AppText
                    weight={focused ? "bold" : "medium"}
                    className={`mt-1 text-[10px] ${focused ? "text-brand-800" : "text-slate-400"}`}
                  >
                    {label}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

import { useRouter } from "expo-router";
import { ChevronLeft, X } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/components/ui/AppText";
import { ProgressSteps } from "@/components/ui/ProgressSteps";

export function WizardHeader({
  title,
  stepLabel,
  totalSteps,
  currentStep,
  onBack,
}: {
  title: string;
  stepLabel: string;
  totalSteps: number;
  currentStep: number;
  onBack: () => void;
}) {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top"]} className="bg-white">
      <View className="flex-row items-center gap-3 px-5 pb-3 pt-2">
        <Pressable
          onPress={onBack}
          className="h-9 w-9 items-center justify-center rounded-full bg-slate-50"
          hitSlop={8}
        >
          <ChevronLeft size={20} color="#334155" />
        </Pressable>
        <AppText weight="bold" className="flex-1 text-base text-slate-900">
          {title}
        </AppText>
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-slate-50"
          hitSlop={8}
        >
          <X size={18} color="#334155" />
        </Pressable>
      </View>
      <View className="px-5 pb-4">
        <ProgressSteps total={totalSteps} current={currentStep} label={stepLabel} />
      </View>
    </SafeAreaView>
  );
}

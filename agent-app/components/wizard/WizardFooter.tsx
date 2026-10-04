import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { Button } from "@/components/ui/Button";

export function WizardFooter({
  onBack,
  onNext,
  backLabel,
  nextLabel,
  nextDisabled,
  showBack = true,
  loading,
}: {
  onBack: () => void;
  onNext: () => void;
  backLabel?: string;
  nextLabel: string;
  nextDisabled?: boolean;
  showBack?: boolean;
  loading?: boolean;
}) {
  const cleanBackLabel = (backLabel ?? "").replace("পেছনে", "পূর্ববর্তী");

  return (
    <SafeAreaView edges={["bottom"]} className="border-t border-slate-100 bg-white px-5 pt-3">
      <View className="flex-row gap-3">
        {showBack && (
          <Button
            variant="secondary"
            onPress={onBack}
            fullWidth={false}
            className="px-5"
            icon={<ChevronLeft size={18} color="#166534" />}
          >
            {cleanBackLabel || "পূর্ববর্তী"}
          </Button>
        )}
        <View className="flex-1">
          <Button onPress={onNext} disabled={nextDisabled} loading={loading}>
            {nextLabel}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}


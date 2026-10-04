import { useState } from "react";
import { Modal, Pressable, TextInput, View } from "react-native";
import { Check, Plus, X } from "lucide-react-native";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";

interface DynamicCropSelectProps {
  initialCrops: string[];
  value: string;
  onChange: (val: string) => void;
}

export function DynamicCropSelect({ initialCrops, value, onChange }: DynamicCropSelectProps) {
  const [crops, setCrops] = useState<string[]>(initialCrops);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCropName, setNewCropName] = useState("");

  const handleAddCrop = () => {
    const trimmed = newCropName.trim();
    if (trimmed) {
      if (!crops.includes(trimmed)) {
        setCrops((prev) => [...prev, trimmed]);
      }
      onChange(trimmed);
      setNewCropName("");
      setModalVisible(false);
    }
  };

  return (
    <View className="gap-2.5">
      <View className="flex-row flex-wrap gap-2">
        {crops.map((crop) => {
          const selected = crop === value;
          return (
            <Pressable
              key={crop}
              onPress={() => onChange(crop)}
              className={`flex-row items-center gap-1.5 rounded-full border px-4 py-2.5 transition-all ${
                selected
                  ? "border-brand-600 bg-brand-50 shadow-sm"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              {selected && (
                <View className="h-4 w-4 items-center justify-center rounded-full bg-brand-600">
                  <Check size={10} color="#ffffff" strokeWidth={3} />
                </View>
              )}
              <AppText
                weight={selected ? "semibold" : "medium"}
                className={`text-sm ${selected ? "text-brand-800" : "text-slate-700"}`}
              >
                {crop}
              </AppText>
            </Pressable>
          );
        })}

        {/* (+) Quick Create Chip */}
        <Pressable
          onPress={() => setModalVisible(true)}
          className="flex-row items-center gap-1.5 rounded-full border border-dashed border-brand-400 bg-brand-50/60 px-4 py-2.5"
        >
          <Plus size={14} color="#166534" strokeWidth={2.5} />
          <AppText weight="semibold" className="text-sm text-brand-800">
            নতুন ফসল
          </AppText>
        </Pressable>
      </View>

      {/* Quick Add Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View className="flex-1 items-center justify-center bg-black/50 px-5">
          <View className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <AppText weight="bold" className="text-base text-slate-900">
                নতুন ফসল যোগ করুন
              </AppText>
              <Pressable
                onPress={() => setModalVisible(false)}
                className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
              >
                <X size={18} color="#64748b" />
              </Pressable>
            </View>

            <View className="my-4">
              <AppText weight="medium" className="mb-2 text-xs text-slate-600">
                ফসলের নাম
              </AppText>
              <TextInput
                value={newCropName}
                onChangeText={setNewCropName}
                placeholder="যেমন: সূর্যমুখী, তরমুজ, সরিষা..."
                placeholderTextColor="#94a3b8"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-3 text-sm text-slate-900"
                autoFocus
              />
            </View>

            <View className="flex-row gap-3 pt-2">
              <Button
                variant="secondary"
                onPress={() => setModalVisible(false)}
                className="flex-1"
                fullWidth={false}
              >
                বাতিল
              </Button>
              <Button
                onPress={handleAddCrop}
                disabled={!newCropName.trim()}
                className="flex-1"
                fullWidth={false}
              >
                যোগ করুন
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

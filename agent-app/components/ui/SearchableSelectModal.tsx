import { useState } from "react";
import { FlatList, Modal, Pressable, TextInput, View } from "react-native";
import { Check, ChevronDown, Search, X } from "lucide-react-native";
import { AppText } from "./AppText";

interface SearchableSelectModalProps {
  label?: string;
  placeholder?: string;
  options: string[];
  value: string;
  onSelect: (val: string) => void;
  icon?: React.ReactNode;
}

export function SearchableSelectModal({
  label,
  placeholder = "নির্বাচন করুন",
  options,
  value,
  onSelect,
  icon,
}: SearchableSelectModalProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <View>
      {label && (
        <AppText weight="semibold" className="mb-2 text-sm text-slate-800">
          {label}
        </AppText>
      )}

      {/* Trigger Button */}
      <Pressable
        onPress={() => {
          setSearchQuery("");
          setModalVisible(true);
        }}
        className={`flex-row items-center justify-between gap-2 rounded-xl border bg-white px-3.5 py-3.5 ${
          value ? "border-brand-500 bg-brand-50/20" : "border-slate-200"
        }`}
      >
        <View className="flex-row items-center gap-2.5 flex-1">
          {icon}
          <AppText
            weight={value ? "semibold" : "regular"}
            className={`text-[15px] ${value ? "text-slate-900" : "text-slate-400"}`}
          >
            {value || placeholder}
          </AppText>
        </View>
        <ChevronDown size={18} color="#64748b" />
      </Pressable>

      {/* Modal Popup */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[80%] rounded-t-3xl bg-white p-5 shadow-2xl">
            {/* Header */}
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <AppText weight="bold" className="text-base text-slate-900">
                {label || placeholder}
              </AppText>
              <Pressable
                onPress={() => setModalVisible(false)}
                className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
              >
                <X size={18} color="#64748b" />
              </Pressable>
            </View>

            {/* Search Input */}
            <View className="my-3 flex-row items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5">
              <Search size={18} color="#94a3b8" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="খুঁজুন..."
                placeholderTextColor="#94a3b8"
                className="min-h-[44px] flex-1 text-sm text-slate-900"
                autoFocus
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery("")}>
                  <X size={16} color="#94a3b8" />
                </Pressable>
              ) : null}
            </View>

            {/* Options List */}
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const selected = item === value;
                return (
                  <Pressable
                    onPress={() => {
                      onSelect(item);
                      setModalVisible(false);
                    }}
                    className={`flex-row items-center justify-between rounded-xl px-4 py-3.5 border-b border-slate-50 ${
                      selected ? "bg-brand-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <AppText
                      weight={selected ? "semibold" : "medium"}
                      className={`text-sm ${selected ? "text-brand-800" : "text-slate-700"}`}
                    >
                      {item}
                    </AppText>
                    {selected && <Check size={18} color="#166534" strokeWidth={2.5} />}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View className="py-8 items-center">
                  <AppText className="text-sm text-slate-400">কোনো ফলাফল পাওয়া যায়নি</AppText>
                </View>
              }
              className="mt-1"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

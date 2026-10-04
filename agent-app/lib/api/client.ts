import { type Farmer, type Batch } from "../mock-data";

export const apiClient = {
  getFarmers: async (): Promise<Farmer[]> => {
    if (process.env.EXPO_PUBLIC_SUPABASE_URL) {
      try {
        const { supabase } = await import("@/lib/supabase");
        if (supabase) {
          const { data, error } = await supabase.from('farmers').select('*').order('synced_at', { ascending: false });
          if (!error && data) {
            return data.map((f: any) => ({
              id: f.id,
              name: f.name || "কৃষক",
              phone: f.phone || "-",
              village: f.village || "গ্রাম",
              union: f.union_name || "ইউনিয়ন",
              landDecimal: Number(f.landDecimal) || 0,
              crop: f.crop || "ধান",
              registeredDaysAgo: 0,
              synced: true,
              hasWallet: !!f.hasWallet,
            }));
          }
        }
      } catch (err) {
        console.error("Error loading live farmers from Supabase:", err);
      }
    }
    return [];
  },

  getBatches: async (): Promise<Batch[]> => {
    if (process.env.EXPO_PUBLIC_SUPABASE_URL) {
      try {
        const { supabase } = await import("@/lib/supabase");
        if (supabase) {
          const { data, error } = await supabase.from('batches').select('*').order('synced_at', { ascending: false });
          if (!error && data) {
            return data.map((b: any) => ({
              id: b.id,
              farmerId: b.farmer_id || "",
              farmerName: b.farmerName || "কৃষক",
              crop: b.crop || "ধান",
              quantityKg: Number(b.quantityKg) || 0,
              harvestDate: b.harvestDate || "",
              inputs: Array.isArray(b.inputs) ? b.inputs : [],
              synced: true,
              createdDaysAgo: 0,
            }));
          }
        }
      } catch (err) {
        console.error("Error loading live batches from Supabase:", err);
      }
    }
    return [];
  },

  syncFarmers: async (pendingFarmers: Partial<Farmer>[]) => {
    if (process.env.EXPO_PUBLIC_SUPABASE_URL) {
      const { supabase } = await import("@/lib/supabase");
      if (supabase && pendingFarmers.length > 0) {
        const { error } = await supabase.from('farmers').upsert(
          pendingFarmers.map((f) => ({
            name: f.name,
            phone: f.phone,
            village: f.village,
            union_name: f.union,
            landDecimal: f.landDecimal,
            crop: f.crop,
            hasWallet: f.hasWallet,
            synced_at: new Date().toISOString(),
          }))
        );
        if (!error) return true;
        console.error("Supabase sync farmers failed:", error);
      }
    }
    return true;
  },

  syncBatches: async (pendingBatches: Partial<Batch>[]) => {
    if (process.env.EXPO_PUBLIC_SUPABASE_URL) {
      const { supabase } = await import("@/lib/supabase");
      if (supabase && pendingBatches.length > 0) {
        const { error } = await supabase.from('batches').upsert(
          pendingBatches.map((b) => ({
            farmerName: b.farmerName,
            crop: b.crop,
            quantityKg: b.quantityKg,
            harvestDate: b.harvestDate,
            inputs: b.inputs,
            synced_at: new Date().toISOString(),
          }))
        );
        if (!error) return true;
        console.error("Supabase sync batches failed:", error);
      }
    }
    return true;
  },
};

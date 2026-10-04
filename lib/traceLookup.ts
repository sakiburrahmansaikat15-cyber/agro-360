import { supabase } from "@/lib/supabase";
import type { TraceRecord } from "@/lib/trace-data";
import { getTraceRecord } from "@/lib/trace-data";

// Names known to be pesticides among the free-text "inputs" agents record
// in the Agent App (see agent-app/lib/mock-data.ts inputOptions) — used only
// to choose an icon/label in the safety section, since the batches table
// stores inputs as a flat string array with no type/timing metadata.
const KNOWN_PESTICIDES = new Set([
  "সাইপারমেথ্রিন",
  "ইমিডাক্লোপ্রিড",
  "ক্লোরপাইরিফস",
  "cypermethrin",
  "imidacloprid",
  "chlorpyrifos",
]);

/**
 * Looks up a batch by its real database id or human-readable display_id and
 * maps it into the same TraceRecord shape the consumer trace page renders.
 *
 * Previously app/trace/[id]/page.tsx only ever read from a hardcoded array
 * of 3 fake batches (lib/trace-data.ts) and never queried the real batches
 * table — so no batch actually created by a field agent could ever be
 * traced. This is deliberately honest about what data is and isn't real:
 * cold-chain telemetry and downstream logistics (storage/transport/retail)
 * don't exist as columns in the schema, so this does not fabricate them —
 * see hasColdChainData and the shortened `journey` below.
 */
export async function fetchRealTraceRecord(idOrDisplayId: string): Promise<TraceRecord | null> {
  if (!supabase || !idOrDisplayId) return null;

  try {
    const { data, error } = await supabase
      .from("batches")
      .select(
        "id, display_id, farmerName, crop, quantityKg, quantitykg, harvestDate, harvestdate, inputs, synced_at, farmers(name, village, union_name, district)"
      )
      .or(`id.eq.${idOrDisplayId},display_id.eq.${idOrDisplayId}`)
      .maybeSingle();

    if (error || !data) return null;

    const farmer: any = data.farmers;
    const crop = data.crop || "ফসল";
    const quantityKg = Number((data as any).quantityKg ?? (data as any).quantitykg ?? 0);
    const harvestDate = (data as any).harvestDate || (data as any).harvestdate || data.synced_at;
    const farmerName = farmer?.name || data.farmerName || "কৃষক";
    const origin = [farmer?.district, farmer?.village || farmer?.union_name].filter(Boolean).join(", ") || "অজানা এলাকা";

    const rawInputs: string[] = Array.isArray(data.inputs) ? data.inputs : [];
    const inputs = rawInputs
      .filter((name) => name && name !== "কোনোটিই নয়")
      .map((name) => ({
        nameEn: name,
        nameBn: name,
        type: KNOWN_PESTICIDES.has(name) ? ("pesticide" as const) : ("fertilizer" as const),
      }));

    const displayId = data.display_id || data.id;

    return {
      id: displayId,
      cropEn: crop,
      cropBn: crop,
      varietyEn: "",
      varietyBn: "",
      quantityKg,
      harvestDate: harvestDate ? String(harvestDate).slice(0, 10) : "",
      farmerEn: farmerName,
      farmerBn: farmerName,
      originEn: origin,
      originBn: origin,
      organic: false,
      inputs,
      coldChain: { maintained: false, avgTempC: 0, hoursMonitored: 0 },
      hasColdChainData: false,
      journey: [
        {
          key: "farmer",
          actorEn: farmerName,
          actorBn: farmerName,
          placeEn: origin,
          placeBn: origin,
          date: harvestDate ? String(harvestDate).slice(0, 10) : "",
          done: true,
        },
        {
          key: "consumer",
          actorEn: "",
          actorBn: "",
          placeEn: "",
          placeBn: "",
          date: new Date().toISOString().slice(0, 10),
          done: false,
        },
      ],
    };
  } catch (err) {
    console.error("fetchRealTraceRecord error:", err);
    return null;
  }
}

/**
 * Resolves a trace record for the given id: the illustrative sample records
 * first (so the "try a demo" link on /trace still works), then a real
 * Supabase lookup for anything else.
 */
export async function resolveTraceRecord(id: string): Promise<TraceRecord | null> {
  const sample = getTraceRecord(id);
  if (sample) return sample;
  return fetchRealTraceRecord(id);
}

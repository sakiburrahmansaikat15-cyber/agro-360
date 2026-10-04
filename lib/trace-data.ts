export type InputRecord = {
  nameEn: string;
  nameBn: string;
  type: "fertilizer" | "pesticide";
  daysBeforeHarvest?: number;
};

export type JourneyStep = {
  key: "farmer" | "storage" | "transport" | "retail" | "consumer";
  actorEn: string;
  actorBn: string;
  placeEn: string;
  placeBn: string;
  date: string;
  done: boolean;
};

export type TraceRecord = {
  id: string;
  cropEn: string;
  cropBn: string;
  varietyEn: string;
  varietyBn: string;
  quantityKg: number;
  harvestDate: string;
  farmerEn: string;
  farmerBn: string;
  originEn: string;
  originBn: string;
  organic: boolean;
  inputs: InputRecord[];
  coldChain: { maintained: boolean; avgTempC: number; hoursMonitored: number };
  journey: JourneyStep[];
  // False for batches looked up live from Supabase, which have no
  // cold-chain sensor columns in the schema — the UI skips the Cold Chain
  // section entirely rather than showing fabricated telemetry. Defaults to
  // true (shown) for the illustrative sample records below.
  hasColdChainData?: boolean;
};

export const traceRecords: TraceRecord[] = [
  {
    id: "AT360-BOG-0231",
    cropEn: "Potato",
    cropBn: "আলু",
    varietyEn: "Diamant",
    varietyBn: "ডায়মন্ট",
    quantityKg: 620,
    harvestDate: "2026-07-20",
    farmerEn: "Abdul Karim",
    farmerBn: "আব্দুল করিম",
    originEn: "Shibganj, Bogura",
    originBn: "শিবগঞ্জ, বগুড়া",
    organic: false,
    inputs: [
      { nameEn: "Urea", nameBn: "ইউরিয়া", type: "fertilizer" },
      { nameEn: "TSP", nameBn: "টিএসপি", type: "fertilizer" },
      { nameEn: "Cypermethrin", nameBn: "সাইপারমেথ্রিন", type: "pesticide", daysBeforeHarvest: 14 },
    ],
    coldChain: { maintained: true, avgTempC: 3.8, hoursMonitored: 168 },
    journey: [
      { key: "farmer", actorEn: "Abdul Karim", actorBn: "আব্দুল করিম", placeEn: "Shibganj, Bogura", placeBn: "শিবগঞ্জ, বগুড়া", date: "2026-07-20", done: true },
      { key: "storage", actorEn: "Bogura Pilot Cold Storage", actorBn: "বগুড়া পাইলট কোল্ড স্টোরেজ", placeEn: "Bogura Sadar", placeBn: "বগুড়া সদর", date: "2026-07-20", done: true },
      { key: "transport", actorEn: "GPS-tracked shipment", actorBn: "GPS-ট্র্যাকড শিপমেন্ট", placeEn: "Bogura → Dhaka", placeBn: "বগুড়া → ঢাকা", date: "2026-07-23", done: true },
      { key: "retail", actorEn: "Karwan Bazar retailer", actorBn: "কারওয়ান বাজার খুচরা বিক্রেতা", placeEn: "Dhaka", placeBn: "ঢাকা", date: "2026-07-24", done: true },
      { key: "consumer", actorEn: "", actorBn: "", placeEn: "", placeBn: "", date: "2026-07-25", done: false },
    ],
  },
  {
    id: "AT360-BOG-0230",
    cropEn: "Potato",
    cropBn: "আলু",
    varietyEn: "Cardinal",
    varietyBn: "কার্ডিনাল",
    quantityKg: 540,
    harvestDate: "2026-07-19",
    farmerEn: "Rahima Begum",
    farmerBn: "রহিমা বেগম",
    originEn: "Sherpur, Bogura",
    originBn: "শেরপুর, বগুড়া",
    organic: true,
    inputs: [
      { nameEn: "DAP", nameBn: "ডিএপি", type: "fertilizer" },
      { nameEn: "MoP", nameBn: "এমওপি", type: "fertilizer" },
    ],
    coldChain: { maintained: true, avgTempC: 4.1, hoursMonitored: 192 },
    journey: [
      { key: "farmer", actorEn: "Rahima Begum", actorBn: "রহিমা বেগম", placeEn: "Sherpur, Bogura", placeBn: "শেরপুর, বগুড়া", date: "2026-07-19", done: true },
      { key: "storage", actorEn: "Bogura Pilot Cold Storage", actorBn: "বগুড়া পাইলট কোল্ড স্টোরেজ", placeEn: "Bogura Sadar", placeBn: "বগুড়া সদর", date: "2026-07-19", done: true },
      { key: "transport", actorEn: "GPS-tracked shipment", actorBn: "GPS-ট্র্যাকড শিপমেন্ট", placeEn: "Bogura → Dhaka", placeBn: "বগুড়া → ঢাকা", date: "2026-07-22", done: true },
      { key: "retail", actorEn: "Mohammadpur retailer", actorBn: "মোহাম্মদপুর খুচরা বিক্রেতা", placeEn: "Dhaka", placeBn: "ঢাকা", date: "2026-07-23", done: true },
      { key: "consumer", actorEn: "", actorBn: "", placeEn: "", placeBn: "", date: "2026-07-24", done: true },
    ],
  },
  {
    id: "AT360-BOG-0229",
    cropEn: "Potato",
    cropBn: "আলু",
    varietyEn: "Granola",
    varietyBn: "গ্রানোলা",
    quantityKg: 710,
    harvestDate: "2026-07-17",
    farmerEn: "Mizanur Rahman",
    farmerBn: "মিজানুর রহমান",
    originEn: "Gabtali, Bogura",
    originBn: "গাবতলী, বগুড়া",
    organic: false,
    inputs: [
      { nameEn: "Urea", nameBn: "ইউরিয়া", type: "fertilizer" },
      { nameEn: "Potash", nameBn: "পটাশ", type: "fertilizer" },
      { nameEn: "Imidacloprid", nameBn: "ইমিডাক্লোপ্রিড", type: "pesticide", daysBeforeHarvest: 21 },
    ],
    coldChain: { maintained: true, avgTempC: 3.6, hoursMonitored: 240 },
    journey: [
      { key: "farmer", actorEn: "Mizanur Rahman", actorBn: "মিজানুর রহমান", placeEn: "Gabtali, Bogura", placeBn: "গাবতলী, বগুড়া", date: "2026-07-17", done: true },
      { key: "storage", actorEn: "Bogura Pilot Cold Storage", actorBn: "বগুড়া পাইলট কোল্ড স্টোরেজ", placeEn: "Bogura Sadar", placeBn: "বগুড়া সদর", date: "2026-07-17", done: true },
      { key: "transport", actorEn: "GPS-tracked shipment", actorBn: "GPS-ট্র্যাকড শিপমেন্ট", placeEn: "Bogura → Chattogram", placeBn: "বগুড়া → চট্টগ্রাম", date: "2026-07-20", done: true },
      { key: "retail", actorEn: "Chawkbazar retailer", actorBn: "চকবাজার খুচরা বিক্রেতা", placeEn: "Chattogram", placeBn: "চট্টগ্রাম", date: "2026-07-21", done: true },
      { key: "consumer", actorEn: "", actorBn: "", placeEn: "", placeBn: "", date: "2026-07-22", done: true },
    ],
  },
];

export function getTraceRecord(id: string): TraceRecord | undefined {
  const target = id.trim().toUpperCase();
  return traceRecords.find((r) => r.id.toUpperCase() === target);
}

export const sampleTraceId = traceRecords[0].id;

/** Whole days between a past ISO date and now (or an explicit reference date). */
export function daysSince(isoDate: string, reference: string | Date = new Date()): number {
  const a = new Date(isoDate).getTime();
  const b = reference instanceof Date ? reference.getTime() : new Date(reference).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

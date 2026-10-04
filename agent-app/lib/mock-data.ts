export type Farmer = {
  id: string;
  name: string;
  phone: string;
  village: string;
  union: string;
  landDecimal: number;
  crop: string;
  registeredDaysAgo: number;
  synced: boolean;
  hasWallet: boolean;
};

export const farmers: Farmer[] = [];

export type Batch = {
  id: string;
  farmerId: string;
  farmerName: string;
  crop: string;
  quantityKg: number;
  harvestDate: string;
  inputs: string[];
  synced: boolean;
  createdDaysAgo: number;
};

export const batches: Batch[] = [];

export const cropOptions = ["আলু", "পেঁয়াজ", "চাল", "ভুট্টা", "গম", "আম"];

export const inputOptions = [
  "ইউরিয়া",
  "টিএসপি",
  "ডিএপি",
  "এমওপি",
  "পটাশ",
  "সাইপারমেথ্রিন",
  "ইমিডাক্লোপ্রিড",
  "ক্লোরপাইরিফস",
  "কোনোটিই নয়",
];

export const districts = ["বগুড়া", "রংপুর", "নওগাঁ", "জয়পুরহাট"];

export const all64Districts = [
  "বগুড়া", "ঢাকা", "চট্টগ্রাম", "সিলেট", "খুলনা", "রাজশাহী", "বরিশাল", "রংপুর", "ময়মনসিংহ",
  "বাগেরহাট", "বান্দরবান", "বরগুনা", "ভোলা", "ব্রাহ্মণবাড়িয়া", "চাঁদপুর", "চাঁপাইনবাবগঞ্জ",
  "চুয়াডাঙ্গা", "কুমিল্লা", "কক্সবাজার", "দিনাজপুর", "ফরিদপুর", "ফেনী", "গাইবান্ধা", "গাজীপুর",
  "গোপালগঞ্জ", "হবিগঞ্জ", "জামালপুর", "যশোর", "ঝালকাঠি", "ঝিনাইদহ", "জয়পুরহাট", "খাগড়াছড়ি",
  "কিশোরগঞ্জ", "কুড়িগ্রাম", "কুষ্টিয়া", "লক্ষ্মীপুর", "লালমনিরহাট", "মাদারীপুর", "মাগুরা",
  "মানিকগঞ্জ", "মেহেরপুর", "মৌলভীবাজার", "মুন্সীগঞ্জ", "নওগাঁ", "নড়াইল", "নারায়ণগঞ্জ",
  "নরসিংদী", "নাটোর", "নেত্রকোণা", "নীলফামারী", "নোয়াখালী", "পাবনা", "পঞ্চগড়", "পটুখালী",
  "পিরোজপুর", "রাজবাড়ী", "রাঙ্গামাটি", "শরীয়তপুর", "শেরপুর", "সিরাজগঞ্জ", "সুনামগঞ্জ",
  "টাঙ্গাইল", "ঠাকুরগাঁও"
];

export const upazilas = ["শিবগঞ্জ", "শেরপুর", "গাবতলী", "সোনাতলা", "ধুনট", "বগুড়া সদর", "নন্দীগ্রাম", "কাহালু", "আদমদীঘি", "দুপচাঁচিয়া", "সারিয়াকান্দি"];

export const agentProfile = {
  name: "মাঠপর্যায়ের এজেন্ট",
  id: "AGT-0000",
  phone: "-",
  region: "বগুড়া সদর, বগুড়া",
  farmersThisMonth: 0,
  batchesThisMonth: 0,
  pendingSync: 0,
};

export const todaysTasks = [];

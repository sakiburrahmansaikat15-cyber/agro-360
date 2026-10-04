export type RiskLevel = "low" | "watch" | "critical";

export type Division = {
  id: string;
  nameEn: string;
  nameBn: string;
  stockMT: number;
  capacityPct: number;
  risk: RiskLevel;
  facilities: number;
};

export const divisions: Division[] = [
  { id: "rajshahi", nameEn: "Rajshahi", nameBn: "রাজশাহী", stockMT: 18400, capacityPct: 82, risk: "watch", facilities: 14 },
  { id: "rangpur", nameEn: "Rangpur", nameBn: "রংপুর", stockMT: 24100, capacityPct: 91, risk: "critical", facilities: 19 },
  { id: "dhaka", nameEn: "Dhaka", nameBn: "ঢাকা", stockMT: 9800, capacityPct: 64, risk: "low", facilities: 22 },
  { id: "chattogram", nameEn: "Chattogram", nameBn: "চট্টগ্রাম", stockMT: 7300, capacityPct: 58, risk: "low", facilities: 11 },
  { id: "khulna", nameEn: "Khulna", nameBn: "খুলনা", stockMT: 5600, capacityPct: 47, risk: "low", facilities: 9 },
  { id: "barishal", nameEn: "Barishal", nameBn: "বরিশাল", stockMT: 4100, capacityPct: 39, risk: "low", facilities: 6 },
  { id: "sylhet", nameEn: "Sylhet", nameBn: "সিলেট", stockMT: 2900, capacityPct: 33, risk: "low", facilities: 5 },
  { id: "mymensingh", nameEn: "Mymensingh", nameBn: "ময়মনসিংহ", stockMT: 6700, capacityPct: 71, risk: "watch", facilities: 8 },
];

export type PricePoint = {
  month: string;
  farmgate: number;
  retail: number;
  mrp: number;
};

export const priceTrend: PricePoint[] = [
  { month: "Feb", farmgate: 14, retail: 32, mrp: 30 },
  { month: "Mar", farmgate: 13, retail: 34, mrp: 30 },
  { month: "Apr", farmgate: 15, retail: 33, mrp: 31 },
  { month: "May", farmgate: 16, retail: 36, mrp: 32 },
  { month: "Jun", farmgate: 18, retail: 35, mrp: 32 },
  { month: "Jul", farmgate: 21, retail: 34, mrp: 33 },
];

export type HoardingAlert = {
  id: string;
  facilityEn: string;
  facilityBn: string;
  districtEn: string;
  districtBn: string;
  cropEn: string;
  cropBn: string;
  stockMT: number;
  riskScore: number;
  flaggedHoursAgo: number;
};

export const hoardingAlerts: HoardingAlert[] = [
  { id: "AL-2291", facilityEn: "Rangpur Central Cold Storage", facilityBn: "রংপুর সেন্ট্রাল কোল্ড স্টোরেজ", districtEn: "Rangpur", districtBn: "রংপুর", cropEn: "Potato", cropBn: "আলু", stockMT: 3120, riskScore: 91, flaggedHoursAgo: 3 },
  { id: "AL-2288", facilityEn: "Badarganj Storage Hub", facilityBn: "বদরগঞ্জ স্টোরেজ হাব", districtEn: "Rangpur", districtBn: "রংপুর", cropEn: "Onion", cropBn: "পেঁয়াজ", stockMT: 980, riskScore: 78, flaggedHoursAgo: 9 },
  { id: "AL-2274", facilityEn: "Naogaon Agro Warehouse", facilityBn: "নওগাঁ এগ্রো ওয়্যারহাউস", districtEn: "Rajshahi", districtBn: "রাজশাহী", cropEn: "Rice", cropBn: "চাল", stockMT: 5600, riskScore: 69, flaggedHoursAgo: 21 },
  { id: "AL-2260", facilityEn: "Mymensingh Riverside Depot", facilityBn: "ময়মনসিংহ রিভারসাইড ডিপো", districtEn: "Mymensingh", districtBn: "ময়মনসিংহ", cropEn: "Potato", cropBn: "আলু", stockMT: 1450, riskScore: 62, flaggedHoursAgo: 30 },
];

export const budgetAllocation = [
  { key: "digital_infra", labelEn: "Digital infrastructure", labelBn: "ডিজিটাল অবকাঠামো", value: 35 },
  { key: "agent_network", labelEn: "Agent network & training", labelBn: "এজেন্ট নেটওয়ার্ক ও প্রশিক্ষণ", value: 25 },
  { key: "iot", labelEn: "IoT deployment", labelBn: "IoT স্থাপনা", value: 20 },
  { key: "ops", labelEn: "Field operations", labelBn: "মাঠ পরিচালনা", value: 10 },
  { key: "contingency", labelEn: "Contingency", labelBn: "সংরক্ষিত তহবিল", value: 10 },
];

export type Facility = {
  id: string;
  nameEn: string;
  nameBn: string;
  districtEn: string;
  districtBn: string;
  divisionId: string;
  cropEn: string;
  cropBn: string;
  stockMT: number;
  capacityPct: number;
  tempC: number;
  humidityPct: number;
  risk: RiskLevel;
  updatedMinsAgo: number;
};

export const facilities: Facility[] = [
  { id: "F-101", nameEn: "Rangpur Central Cold Storage", nameBn: "রংপুর সেন্ট্রাল কোল্ড স্টোরেজ", districtEn: "Rangpur", districtBn: "রংপুর", divisionId: "rangpur", cropEn: "Potato", cropBn: "আলু", stockMT: 3120, capacityPct: 96, tempC: 4.2, humidityPct: 91, risk: "critical", updatedMinsAgo: 6 },
  { id: "F-102", nameEn: "Badarganj Storage Hub", nameBn: "বদরগঞ্জ স্টোরেজ হাব", districtEn: "Rangpur", districtBn: "রংপুর", divisionId: "rangpur", cropEn: "Onion", cropBn: "পেঁয়াজ", stockMT: 980, capacityPct: 88, tempC: 12.1, humidityPct: 68, risk: "watch", updatedMinsAgo: 14 },
  { id: "F-103", nameEn: "Naogaon Agro Warehouse", nameBn: "নওগাঁ এগ্রো ওয়্যারহাউস", districtEn: "Rajshahi", districtBn: "রাজশাহী", divisionId: "rajshahi", cropEn: "Rice", cropBn: "চাল", stockMT: 5600, capacityPct: 79, tempC: 22.4, humidityPct: 55, risk: "watch", updatedMinsAgo: 22 },
  { id: "F-104", nameEn: "Bogura Pilot Cold Storage", nameBn: "বগুড়া পাইলট কোল্ড স্টোরেজ", districtEn: "Bogura", districtBn: "বগুড়া", divisionId: "rajshahi", cropEn: "Potato", cropBn: "আলু", stockMT: 1180, capacityPct: 61, tempC: 3.8, humidityPct: 89, risk: "low", updatedMinsAgo: 3 },
  { id: "F-105", nameEn: "Mymensingh Riverside Depot", nameBn: "ময়মনসিংহ রিভারসাইড ডিপো", districtEn: "Mymensingh", districtBn: "ময়মনসিংহ", divisionId: "mymensingh", cropEn: "Potato", cropBn: "আলু", stockMT: 1450, capacityPct: 74, tempC: 5.1, humidityPct: 85, risk: "watch", updatedMinsAgo: 40 },
  { id: "F-106", nameEn: "Dhaka Wholesale Cold Chain", nameBn: "ঢাকা হোলসেল কোল্ড চেইন", districtEn: "Dhaka", districtBn: "ঢাকা", divisionId: "dhaka", cropEn: "Mango", cropBn: "আম", stockMT: 640, capacityPct: 52, tempC: 8.6, humidityPct: 72, risk: "low", updatedMinsAgo: 18 },
  { id: "F-107", nameEn: "Khulna Coastal Storage", nameBn: "খুলনা কোস্টাল স্টোরেজ", districtEn: "Khulna", districtBn: "খুলনা", divisionId: "khulna", cropEn: "Rice", cropBn: "চাল", stockMT: 2100, capacityPct: 44, tempC: 21.9, humidityPct: 58, risk: "low", updatedMinsAgo: 55 },
  { id: "F-108", nameEn: "Chattogram Export Terminal", nameBn: "চট্টগ্রাম এক্সপোর্ট টার্মিনাল", districtEn: "Chattogram", districtBn: "চট্টগ্রাম", divisionId: "chattogram", cropEn: "Mango", cropBn: "আম", stockMT: 890, capacityPct: 60, tempC: 7.3, humidityPct: 70, risk: "low", updatedMinsAgo: 27 },
];

export type Batch = {
  id: string;
  farmerEn: string;
  farmerBn: string;
  originEn: string;
  originBn: string;
  cropEn: string;
  cropBn: string;
  harvestDate: string;
  inputsEn: string;
  inputsBn: string;
  currentStep: number;
  status: "done" | "pending";
};

export const batches: Batch[] = [
  { id: "AT360-BOG-0231", farmerEn: "Abdul Karim", farmerBn: "আব্দুল করিম", originEn: "Shibganj, Bogura", originBn: "শিবগঞ্জ, বগুড়া", cropEn: "Potato", cropBn: "আলু", harvestDate: "2026-06-28", inputsEn: "Urea, TSP · Cypermethrin (14d pre-harvest)", inputsBn: "ইউরিয়া, টিএসপি · সাইপারমেথ্রিন (১৪ দিন পূর্বে)", currentStep: 4, status: "pending" },
  { id: "AT360-BOG-0230", farmerEn: "Rahima Begum", farmerBn: "রহিমা বেগম", originEn: "Sherpur, Bogura", originBn: "শেরপুর, বগুড়া", cropEn: "Potato", cropBn: "আলু", harvestDate: "2026-06-27", inputsEn: "DAP, MoP · No pesticide (organic block)", inputsBn: "ডিএপি, এমওপি · কীটনাশক ব্যবহৃত হয়নি", currentStep: 5, status: "done" },
  { id: "AT360-BOG-0229", farmerEn: "Mizanur Rahman", farmerBn: "মিজানুর রহমান", originEn: "Gabtali, Bogura", originBn: "গাবতলী, বগুড়া", cropEn: "Potato", cropBn: "আলু", harvestDate: "2026-06-25", inputsEn: "Urea, Potash · Imidacloprid (21d pre-harvest)", inputsBn: "ইউরিয়া, পটাশ · ইমিডাক্লোপ্রিড (২১ দিন পূর্বে)", currentStep: 5, status: "done" },
  { id: "AT360-BOG-0227", farmerEn: "Jasmine Akter", farmerBn: "জেসমিন আক্তার", originEn: "Sonatola, Bogura", originBn: "সোনাতলা, বগুড়া", cropEn: "Potato", cropBn: "আলু", harvestDate: "2026-06-24", inputsEn: "TSP, MoP · Chlorpyrifos (18d pre-harvest)", inputsBn: "টিএসপি, এমওপি · ক্লোরপাইরিফস (১৮ দিন পূর্বে)", currentStep: 3, status: "pending" },
];

export type DistrictFarmers = {
  districtEn: string;
  districtBn: string;
  count: number;
  target: number;
};

export const farmerRegistry: DistrictFarmers[] = [
  { districtEn: "Bogura", districtBn: "বগুড়া", count: 78, target: 100 },
  { districtEn: "Rangpur", districtBn: "রংপুর", count: 12, target: 50 },
  { districtEn: "Naogaon", districtBn: "নওগাঁ", count: 6, target: 50 },
  { districtEn: "Joypurhat", districtBn: "জয়পুরহাট", count: 4, target: 50 },
];

export type CropPriceStatus = {
  cropKey: string;
  currentPrice: number;
  mrp: number;
};

export const cropPriceStatus: CropPriceStatus[] = [
  { cropKey: "crop_potato", currentPrice: 34, mrp: 33 },
  { cropKey: "crop_onion", currentPrice: 68, mrp: 55 },
  { cropKey: "crop_rice", currentPrice: 58, mrp: 56 },
  { cropKey: "crop_mango", currentPrice: 92, mrp: 85 },
];

export const roadmapPhases = [
  { key: "phase1", range: "1–4", progress: 100 },
  { key: "phase2", range: "4–8", progress: 100 },
  { key: "phase3", range: "8–14", progress: 62 },
  { key: "phase4", range: "14–24", progress: 0 },
];

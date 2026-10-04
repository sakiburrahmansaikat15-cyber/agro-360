"use client";

import { useState, useEffect } from "react";
import { Filter, LayoutGrid, Map as MapIcon, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { BangladeshMap } from "@/components/map/BangladeshMap";
import { DistrictDrawer } from "@/components/map/DistrictDrawer";
import {
  districtGeoData,
  divisionLabels,
  type DistrictGeo,
  type DistrictMapData,
  type RiskLevel,
} from "@/lib/map-data";
import { useT, useLanguage } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase";

type ColorMode = "risk" | "division";

const divisions = Object.entries(divisionLabels).map(([id, { en }]) => ({ id, label: en }));

function seedDistrict(geo: DistrictGeo): DistrictMapData {
  return {
    ...geo,
    farmers: 0,
    stockMT: 0,
    batchCount: 0,
    risk: "low",
    hasData: false,
    alertsCount: 0,
    primaryCropsEn: [],
    primaryCropsBn: [],
    lastUpdated: null,
  };
}

function matchesDistrict(geo: DistrictGeo, loc: string): boolean {
  const nameEn = (geo.nameEn || "").toLowerCase();
  const nameBn = geo.nameBn || "";
  return loc.includes(nameEn) || (nameBn !== "" && loc.includes(nameBn));
}

export function MapPageContent() {
  const t = useT();
  const { locale } = useLanguage();
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictMapData | null>(null);
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [colorMode, setColorMode] = useState<ColorMode>("risk");
  const [districtMapData, setDistrictMapData] = useState<DistrictMapData[]>(() =>
    districtGeoData.map(seedDistrict)
  );

  useEffect(() => {
    async function loadLiveDistrictMap() {
      if (!supabase) return;

      try {
        const { data: farmers } = await supabase.from("farmers").select("*");
        // Fetch batches separately — the FK join batches→farmers is not
        // reliably resolved by PostgREST's schema cache.
        const { data: batches } = await supabase
          .from("batches")
          .select("*");

        const farmerList: any[] = farmers || [];
        const batchList: any[] = batches || [];

        // Build farmer lookup by ID for batch→farmer resolution
        const farmerById = new Map<string, any>();
        farmerList.forEach((f: any) => farmerById.set(f.id, f));

        setDistrictMapData(
          districtGeoData.map((geo) => {
            const matchingFarmers = farmerList.filter((f: any) => {
              const loc = `${f.district || ""} ${f.village || ""} ${f.union_name || ""}`.toLowerCase();
              return matchesDistrict(geo, loc);
            });

            const matchingBatches = batchList.filter((b: any) => {
              const farmer = b.farmer_id ? farmerById.get(b.farmer_id) : null;
              if (!farmer) return false;
              const loc = `${farmer.district || ""} ${farmer.village || ""} ${farmer.union_name || ""}`.toLowerCase();
              return matchesDistrict(geo, loc);
            });

            const farmerCount = matchingFarmers.length;
            const batchCount = matchingBatches.length;
            const stockKg = matchingBatches.reduce(
              (sum: number, b: any) => sum + (Number(b.quantityKg ?? b.quantitykg) || 0),
              0
            );
            const stockMT = Math.round(stockKg / 1000);

            const cropCounts = new Map<string, number>();
            matchingBatches.forEach((b: any) => {
              const crop = (b.crop || "").trim();
              if (!crop) return;
              cropCounts.set(crop, (cropCounts.get(crop) || 0) + 1);
            });
            const primaryCropsEn = Array.from(cropCounts.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([crop]) => crop);
            const primaryCropsBn = primaryCropsEn.map(() => "");

            // Without a market_prices table, risk is derived from stock
            // concentration thresholds instead of price deviation.
            let risk: RiskLevel = "low";
            let alertsCount = 0;
            if (stockMT >= 50) {
              risk = "critical";
              alertsCount = 1;
            } else if (stockMT >= 20) {
              risk = "watch";
            }

            const timestamps = [
              ...matchingFarmers.map((f: any) => f.synced_at),
              ...matchingBatches.map((b: any) => b.synced_at),
            ].filter(Boolean);
            const lastUpdated = timestamps.length
              ? timestamps.reduce((a: string, b: string) => (new Date(a) > new Date(b) ? a : b))
              : null;

            return {
              ...geo,
              farmers: farmerCount,
              stockMT,
              batchCount,
              risk,
              hasData: farmerCount > 0 || batchCount > 0,
              alertsCount,
              primaryCropsEn,
              primaryCropsBn,
              lastUpdated,
            };
          })
        );
      } catch (err) {
        console.error("Live district map load error:", err);
      }
    }

    loadLiveDistrictMap();

    if (supabase) {
      const channel = supabase
        .channel("realtime_district_map")
        .on("postgres_changes", { event: "*", schema: "public", table: "farmers" }, loadLiveDistrictMap)
        .on("postgres_changes", { event: "*", schema: "public", table: "batches" }, loadLiveDistrictMap)
        .on("postgres_changes", { event: "*", schema: "public", table: "assigned_areas" }, loadLiveDistrictMap)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const activeFilterCount =
    (divisionFilter !== "all" ? 1 : 0) + (riskFilter !== "all" ? 1 : 0);

  const resetFilters = () => {
    setDivisionFilter("all");
    setRiskFilter("all");
  };

  const handleDistrictSelect = (district: DistrictMapData) => {
    setSelectedDistrict((prev) => (prev?.id === district.id ? null : district));
  };

  const handleClose = () => setSelectedDistrict(null);

  // Summary stats for filter-matching districts
  const matching = districtMapData.filter((d) => {
    if (divisionFilter !== "all" && d.divisionId !== divisionFilter) return false;
    if (riskFilter !== "all" && d.risk !== riskFilter) return false;
    return true;
  });
  const criticalCount = matching.filter((d) => d.hasData && d.risk === "critical").length;
  const noDataCount = matching.filter((d) => !d.hasData).length;
  const totalStock = matching.reduce((s, d) => s + d.stockMT, 0);

  return (
    <AppShell>
      {/* ── Page header ── */}
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {t("map.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("map.subtitle")}
          </p>
        </div>

        {/* Summary pills */}
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <StatPill
            label={t("map.districts_shown")}
            value={matching.length.toLocaleString(locale === "bn" ? "bn-BD" : "en-US")}
            color="text-brand-700 bg-brand-50 ring-brand-200"
          />
          <StatPill
            label={t("map.critical")}
            value={criticalCount.toLocaleString(locale === "bn" ? "bn-BD" : "en-US")}
            color={criticalCount > 0 ? "text-red-700 bg-red-50 ring-red-200" : "text-slate-500 bg-slate-50 ring-slate-200"}
          />
          <StatPill
            label={t("map.total_stock")}
            value={`${(totalStock / 1000).toLocaleString(locale === "bn" ? "bn-BD" : "en-US", { maximumFractionDigits: 1 })}k ${t("common.tons")}`}
            color="text-amber-700 bg-amber-50 ring-amber-200"
          />
          <StatPill
            label={t("map.no_data_badge")}
            value={noDataCount.toLocaleString(locale === "bn" ? "bn-BD" : "en-US")}
            color="text-slate-500 bg-slate-100 ring-slate-200"
          />
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
          <Filter size={14} />
          {t("map.filters")}
        </span>

        {/* Division */}
        <FilterSelect
          label={t("map.filter_division")}
          value={divisionFilter}
          onChange={setDivisionFilter}
          options={[
            { value: "all", label: t("map.all_divisions") },
            ...divisions.map((d) => ({
              value: d.id,
              label: locale === "bn" ? divisionLabels[d.id as keyof typeof divisionLabels].bn : d.label,
            })),
          ]}
        />

        {/* Risk level */}
        <FilterSelect
          label={t("map.filter_risk")}
          value={riskFilter}
          onChange={setRiskFilter}
          options={[
            { value: "all", label: t("map.all_risk") },
            { value: "critical", label: t("map.risk_critical") },
            { value: "watch", label: t("map.risk_watch") },
            { value: "low", label: t("map.risk_low") },
          ]}
        />

        {/* Color mode toggle */}
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          <ModeBtn
            active={colorMode === "risk"}
            onClick={() => setColorMode("risk")}
            icon={<TriangleDot />}
            label={t("map.mode_risk")}
          />
          <ModeBtn
            active={colorMode === "division"}
            onClick={() => setColorMode("division")}
            icon={<LayoutGrid size={13} />}
            label={t("map.mode_division")}
          />
        </div>

        {/* Reset */}
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
          >
            <X size={12} />
            {t("map.reset")} ({activeFilterCount.toLocaleString(locale === "bn" ? "bn-BD" : "en-US")})
          </button>
        )}
      </div>

      {/* ── Map area ── */}
      <div className="relative h-[calc(100vh-270px)] min-h-[400px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <BangladeshMap
          districts={districtMapData}
          selectedId={selectedDistrict?.id ?? null}
          onSelect={handleDistrictSelect}
          divisionFilter={divisionFilter}
          riskFilter={riskFilter}
          colorMode={colorMode}
        />

        <DistrictDrawer
          district={selectedDistrict}
          onClose={handleClose}
        />
      </div>

      {/* ── Hint ── */}
      <p className="mt-3 text-center text-xs text-slate-400 shrink-0">
        {t("map.hint")}
      </p>
    </AppShell>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:border-slate-300">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ModeBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
        active
          ? "bg-brand-600 text-white"
          : "text-slate-500 hover:bg-slate-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${color}`}
    >
      {value}
      <span className="font-normal opacity-70">{label}</span>
    </span>
  );
}

function TriangleDot() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M6.5 1L12 11H1L6.5 1Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <circle cx="6.5" cy="8" r="1.5" fill="currentColor" />
    </svg>
  );
}

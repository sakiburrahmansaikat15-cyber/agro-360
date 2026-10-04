"use client";

import { useRef, useState } from "react";
import { clsx } from "clsx";
import {
  riskFill,
  divisionColors,
  SVG_W,
  SVG_H,
  type DistrictMapData,
} from "@/lib/map-data";
import { useT, useLanguage } from "@/lib/i18n/context";

type ColorMode = "risk" | "division";

type Props = {
  districts: DistrictMapData[];
  selectedId: string | null;
  onSelect: (district: DistrictMapData) => void;
  divisionFilter: string;
  riskFilter: string;
  colorMode: ColorMode;
};

const FILTERED_FILL = "#f1f5f9";  // slate-100 — hidden by the active filter
const NO_DATA_FILL = "#e2e8f0";   // slate-200 — no farmers/batches recorded yet (distinct from "low risk")
const NO_DATA_FILL_HOVER = "#cbd5e1"; // slate-300
const SELECTED_FILL = "#1e5c37"; // brand-800
const SELECTED_FILL_LABEL = "#ffffff";

// Manual offsets for dense central districts to prevent label overlap
const LABEL_OFFSETS: Record<string, { dx?: number; dy?: number }> = {
  dhaka: { dx: -12, dy: -6 },
  narayanganj: { dx: 14, dy: 4 },
  munshiganj: { dx: -2, dy: 10 },
  gazipur: { dy: -8 },
  narsingdi: { dx: 12, dy: -2 },
  manikganj: { dx: -12, dy: 2 },
  shariatpur: { dx: 5, dy: 5 },
  madaripur: { dx: -8, dy: 6 },
  barishal: { dx: -2, dy: 8 },
  jhalokathi: { dx: -10, dy: -2 },
  pirojpur: { dx: -12, dy: 5 },
  meherpur: { dx: -6 },
  chuadanga: { dx: -6, dy: 5 },
  magura: { dx: -8 },
  narail: { dy: 6 },
  feni: { dx: 10, dy: -2 },
  noakhali: { dy: 5 },
  lakshmipur: { dx: -8, dy: 5 },
  khulna: { dy: -8 },
  bagerhat: { dx: 10 },
  jessore: { dx: -5 },
};

export function BangladeshMap({
  districts,
  selectedId,
  onSelect,
  divisionFilter,
  riskFilter,
  colorMode,
}: Props) {
  const t = useT();
  const { locale } = useLanguage();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const isFiltered = (d: DistrictMapData): boolean => {
    if (divisionFilter !== "all" && d.divisionId !== divisionFilter) return true;
    if (riskFilter !== "all" && d.risk !== riskFilter) return true;
    return false;
  };

  const getFill = (d: DistrictMapData): string => {
    if (isFiltered(d)) return FILTERED_FILL;
    if (d.id === selectedId) return SELECTED_FILL;

    const isHovered = hoveredId === d.id;

    if (colorMode === "division") {
      const base = divisionColors[d.divisionId] ?? "#d1fae5";
      return isHovered ? darken(base) : base;
    }

    // Risk choropleth — a district with no recorded farmers/batches yet is
    // shown as a neutral "no data" grey, never as a false "low risk" green.
    if (!d.hasData) {
      return isHovered ? NO_DATA_FILL_HOVER : NO_DATA_FILL;
    }

    const base = riskFill[d.risk];
    return isHovered ? darken(base) : base;
  };

  const getStroke = (d: DistrictMapData): { color: string; width: number } => {
    if (d.id === selectedId) return { color: "#ffffff", width: 2.25 };
    if (hoveredId === d.id) return { color: "#1e5c37", width: 1.5 };
    return { color: "#ffffff", width: 0.8 };
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-brand-50/40">
      {/* Map */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="h-full w-full"
        style={{ display: "block" }}
        aria-label="Interactive map of Bangladesh — 64 districts"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="districtShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor="#0f172a" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Districts */}
        {districts.map((district) => {
          const stroke = getStroke(district);
          const fill = getFill(district);
          const cx = district.cx;
          const cy = district.cy;
          const filtered = isFiltered(district);
          const selected = district.id === selectedId;

          return (
            <g
              key={district.id}
              role="button"
              aria-label={`${district.nameEn} district — click to view details`}
              tabIndex={0}
              className="cursor-pointer focus:outline-none"
              onMouseEnter={() => !filtered && setHoveredId(district.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => !filtered && onSelect(district)}
              onKeyDown={(e) => e.key === "Enter" && !filtered && onSelect(district)}
            >
              <path
                d={district.svgPath}
                fill={fill}
                stroke={stroke.color}
                strokeWidth={stroke.width}
                strokeLinejoin="round"
                filter={selected ? "url(#districtShadow)" : undefined}
                style={{ transition: "fill 120ms ease, stroke-width 120ms ease" }}
              />

              {/* District name label — always visible */}
              {!filtered && (
                <text
                  x={cx + (LABEL_OFFSETS[district.id]?.dx ?? 0)}
                  y={cy + (LABEL_OFFSETS[district.id]?.dy ?? 0)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={selected ? 11 : 7.5}
                  fontWeight={selected ? "700" : "500"}
                  fill={selected ? SELECTED_FILL_LABEL : "#475569"} // slate-600 for unselected
                  style={{ pointerEvents: "none", userSelect: "none", textShadow: "0px 0px 4px rgba(255,255,255,0.9)" }}
                  className={locale === "bn" ? "font-bn" : "font-sans tracking-tight"}
                >
                  {locale === "bn" ? district.nameBn : district.nameEn}
                </text>
              )}

              {/* Small dot marking districts with an active price alert */}
              {!filtered && district.alertsCount > 0 && (
                <circle
                  cx={cx + 8}
                  cy={cy - 6}
                  r={2.4}
                  fill="#ef4444"
                  stroke="#ffffff"
                  strokeWidth={0.6}
                  style={{ pointerEvents: "none" }}
                />
              )}
            </g>
          );
        })}

        {/* Selected district pulse ring */}
        {selectedId && (() => {
          const d = districts.find((x) => x.id === selectedId);
          if (!d) return null;
          return (
            <circle
              cx={d.cx}
              cy={d.cy}
              r={6}
              fill="#ffffff"
              stroke="#1e5c37"
              strokeWidth={2}
              style={{ pointerEvents: "none" }}
            />
          );
        })()}
      </svg>

      {/* Hover tooltip */}
      {hoveredId && hoveredId !== selectedId && (() => {
        const d = districts.find((x) => x.id === hoveredId);
        if (!d || isFiltered(d)) return null;
        const px = (d.cx / SVG_W) * 100;
        const py = (d.cy / SVG_H) * 100;
        return (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
            style={{ left: `${px}%`, top: `${py}%` }}
          >
            <div className="mb-1 min-w-[140px] rounded-xl bg-slate-900/95 px-3 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="whitespace-nowrap">{locale === "bn" ? d.nameBn : d.nameEn}</span>
                <span className="whitespace-nowrap font-normal text-slate-300">
                  {locale === "bn" ? d.nameEn : d.nameBn}
                </span>
              </div>
              {d.hasData ? (
                <div className="mt-1.5 flex items-center gap-2 border-t border-white/10 pt-1.5 font-normal text-slate-300">
                  <span>{d.farmers.toLocaleString(locale === "bn" ? "bn-BD" : "en-US")} {t("map.farmers")}</span>
                  <span className="text-slate-500">·</span>
                  <span>{d.stockMT.toLocaleString(locale === "bn" ? "bn-BD" : "en-US")} {t("common.tons")}</span>
                </div>
              ) : (
                <div className="mt-1.5 border-t border-white/10 pt-1.5 font-normal text-slate-400">
                  {t("map.no_data_badge")}
                </div>
              )}
            </div>
            <div className="flex justify-center">
              <div className="h-1.5 w-1.5 rotate-45 bg-slate-900/95" />
            </div>
          </div>
        );
      })()}

      {/* Risk legend */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 rounded-xl bg-white/90 p-2.5 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-sm">
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {colorMode === "risk" ? t("map.legend_risk") : t("map.legend_division")}
        </p>
        {colorMode === "risk" ? (
          <>
            <LegendItem color="#fca5a5" label={t("inventory.risk_critical")} />
            <LegendItem color="#fcd34d" label={t("inventory.risk_watch")} />
            <LegendItem color="#86efac" label={t("inventory.risk_low")} />
            <LegendItem color={NO_DATA_FILL} label={t("map.no_data_badge")} />
            <LegendItem color={FILTERED_FILL} label={t("map.legend_filtered")} />
          </>
        ) : (
          Object.entries(divisionColors).map(([key, color]) => {
            const divisionData = districts.find((d) => d.divisionId === key);
            const label = locale === "bn" && divisionData ? divisionData.divisionBn : key.charAt(0).toUpperCase() + key.slice(1);
            return (
              <LegendItem key={key} color={color} label={label} />
            );
          })
        )}
      </div>

      {/* District count badge */}
      <div className="absolute right-3 top-3 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-sm">
        {t("map.districts_badge")}
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="h-3 w-3 shrink-0 rounded-sm border border-slate-200"
        style={{ backgroundColor: color }}
      />
      <span className="text-[11px] text-slate-600">{label}</span>
    </div>
  );
}

/** Slightly darken a hex colour for hover state */
function darken(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - 30);
  const g = Math.max(0, ((n >> 8) & 0xff) - 30);
  const b = Math.max(0, (n & 0xff) - 30);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/**
 * Shared design tokens for the Agent App.
 *
 * Before this file existed, the hero gradient colors below were copy-pasted
 * as raw hex literals into 5+ screens (Home, Farmers, Batches, Tasks,
 * Profile, Farmer registration wizard) and several "action" colors
 * (#166534, #15803d, #F8FAFC, ...) were hardcoded ad hoc with no
 * relationship to the brand scale defined in tailwind.config.js. Import
 * from here instead of re-typing hex values so the whole app moves together
 * when the palette changes.
 */

/** Deep-green hero banner gradient used behind the top of every tab root screen. */
export const HERO_GRADIENT = ["#0b1f13", "#164e2a", "#1d6938"] as const;

/** Compact variant of the hero gradient for secondary/detail headers. */
export const COMPACT_HERO_GRADIENT = ["#122e1e", "#1e5534"] as const;

/**
 * Solid brand-green accent colors used outside of NativeWind class strings
 * (icon colors, ActivityIndicator colors, RefreshControl tint, etc. all take
 * raw color values, not className). These map 1:1 onto the brand.*
 * tailwind scale in tailwind.config.js — keep them in sync if that changes.
 */
export const COLORS = {
  brand50: "#eef8f1",
  brand100: "#d7eedd",
  brand400: "#55a76e",
  brand500: "#368752",
  brand600: "#256b3f",
  brand700: "#1e5534",
  brand800: "#19432b",
  brand900: "#122e1e",
  brand950: "#081b11",
  canvas: "#f3f6f3",
  surface: "#ffffff",
  border: "#E2E8F0",
  borderSubtle: "#F1F5F9",
  textPrimary: "#0F172A",
  textMuted: "#64748B",
  textFaint: "#94A3B8",
  success: "#166534",
  successStrong: "#15803d",
  warning: "#d97706",
  warningBg: "#FEF3C7",
  danger: "#dc2626",
} as const;

/** Shared corner-radius scale — replaces ad-hoc 12/14/16/18/20/24/28/36 values. */
export const RADIUS = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Shared spacing scale for screen padding / gaps. */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

/** Standard soft card shadow used across list/detail cards. */
export const CARD_SHADOW = {
  shadowColor: "#0f172a",
  shadowOpacity: 0.02,
  shadowRadius: 6,
  elevation: 1,
} as const;

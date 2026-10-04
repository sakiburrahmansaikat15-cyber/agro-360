import type { Metadata } from "next";
import { MapPageContent } from "@/components/map/MapPageContent";
import { RequireAdmin } from "@/components/layout/RequireAdmin";

export const metadata: Metadata = {
  title: "District Map — Agro-Trust 360",
  description:
    "Interactive GIS map of all 64 Bangladesh districts with real-time hoarding risk, cold storage inventory levels, and farmer registration data.",
};

export default function MapPage() {
  return (
    <RequireAdmin>
      <MapPageContent />
    </RequireAdmin>
  );
}

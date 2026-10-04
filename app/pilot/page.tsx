import type { Metadata } from "next";
import { PilotPageContent } from "@/components/dashboard/PilotPageContent";
import { RequireAdmin } from "@/components/layout/RequireAdmin";

export const metadata: Metadata = {
  title: "Pilot Program — Bogura — Agro-Trust 360",
  description:
    "24-month Bogura potato-season pilot: implementation roadmap, season-end targets, and live program metrics before national scale-up.",
};

export default function PilotPage() {
  return (
    <RequireAdmin>
      <PilotPageContent />
    </RequireAdmin>
  );
}

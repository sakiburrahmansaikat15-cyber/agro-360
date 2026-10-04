import type { Metadata } from "next";
import { InventoryPageContent } from "@/components/dashboard/InventoryPageContent";
import { RequireAdmin } from "@/components/layout/RequireAdmin";

export const metadata: Metadata = {
  title: "Inventory & Price Monitoring — Agro-Trust 360",
  description:
    "Real-time cold storage stock levels, IoT sensor health, and hoarding-risk scores across all monitored facilities in Bangladesh.",
};

export default function InventoryPage() {
  return (
    <RequireAdmin>
      <InventoryPageContent />
    </RequireAdmin>
  );
}

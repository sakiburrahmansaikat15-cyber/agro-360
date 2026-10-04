import type { Metadata } from "next";
import { TraceabilityPageContent } from "@/components/dashboard/TraceabilityPageContent";
import { RequireAdmin } from "@/components/layout/RequireAdmin";

export const metadata: Metadata = {
  title: "Traceability & Farmer Network — Agro-Trust 360",
  description:
    "QR-linked batch tracing from field to consumer, farmer registry by district, and full chain-of-custody records on the national Agro-Trust 360 network.",
};

export default function TraceabilityPage() {
  return (
    <RequireAdmin>
      <TraceabilityPageContent />
    </RequireAdmin>
  );
}

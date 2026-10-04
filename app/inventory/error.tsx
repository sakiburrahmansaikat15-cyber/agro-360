"use client";

import { ErrorFallback } from "@/components/ui/ErrorFallback";
import { AppShell } from "@/components/layout/AppShell";

export default function InventoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppShell>
      <ErrorFallback error={error} reset={reset} />
    </AppShell>
  );
}

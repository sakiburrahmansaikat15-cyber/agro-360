import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/Skeleton";

export default function MapLoading() {
  return (
    <AppShell>
      {/* Page header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex gap-3">
        <Skeleton className="h-9 w-40 rounded-lg" />
        <Skeleton className="h-9 w-36 rounded-lg" />
        <Skeleton className="ml-auto h-9 w-36 rounded-lg" />
      </div>

      {/* Map area */}
      <div
        className="animate-pulse rounded-2xl bg-slate-200"
        style={{ height: "calc(100vh - 260px)", minHeight: 480 }}
      />

      {/* Hint */}
      <Skeleton className="mx-auto mt-3 h-3 w-64" />
    </AppShell>
  );
}

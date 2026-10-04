import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/Skeleton";

/** Skeleton screen for the Traceability & Farmer Network page ( /traceability ) */
export default function TraceabilityLoading() {
  return (
    <AppShell>
      {/* PageHeader */}
      <div className="mb-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      </div>

      {/* Batch lookup — 5-col grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Left: lookup panel */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5 lg:col-span-3">
          <Skeleton className="h-4 w-28 mb-3" />

          {/* Search bar */}
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-10 w-20 rounded-xl" />
          </div>

          {/* Selected batch detail */}
          <div className="mt-6 flex gap-4 rounded-xl border border-slate-100 p-4">
            <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-44" />
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className={`h-3 ${i === 3 ? "col-span-2" : ""} w-full`} />
                ))}
              </div>
            </div>
          </div>

          {/* Chain of custody */}
          <div className="mt-6">
            <Skeleton className="mb-6 h-3 w-32" />
            <div className="flex items-center justify-between">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-3 w-14" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: recent batches */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5 lg:col-span-2">
          <Skeleton className="h-4 w-40 mb-4" />
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Farmer registry card */}
      <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
        <Skeleton className="h-4 w-48 mb-1" />
        <Skeleton className="h-3 w-64 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-2 flex-1 rounded-full" />
              <Skeleton className="h-4 w-14" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/Skeleton";

/** Skeleton screen for the Overview dashboard ( / ) */
export default function OverviewLoading() {
  return (
    <AppShell>
      {/* PageHeader */}
      <div className="mb-6">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      </div>

      {/* KPI cards — 4-column */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5"
          >
            <div className="flex items-start justify-between">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-7 w-28" />
            <Skeleton className="mt-2 h-3.5 w-36" />
            <Skeleton className="mt-1 h-3 w-28" />
          </div>
        ))}
      </div>

      {/* Price chart + Alerts */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5 lg:col-span-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="mt-1 h-3 w-64" />
          <Skeleton className="mt-4 h-52 w-full rounded-xl" />
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
          <Skeleton className="h-4 w-36 mb-4" />
          <div className="space-y-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-slate-50 py-3 last:border-0"
              >
                <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-10 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Regional grid + Budget */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5 lg:col-span-2">
          <Skeleton className="h-4 w-48 mb-1" />
          <Skeleton className="h-3 w-56 mb-4" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-100 p-3">
                <Skeleton className="h-3.5 w-20 mb-2" />
                <Skeleton className="h-5 w-16 mb-2" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
          <Skeleton className="h-4 w-40 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <div className="mb-1.5 flex justify-between">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3.5 w-8" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pilot status */}
      <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
        <Skeleton className="h-4 w-44 mb-1" />
        <Skeleton className="h-3 w-56 mb-4" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-100 p-4">
              <Skeleton className="h-6 w-16 mb-1" />
              <Skeleton className="h-3.5 w-24" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

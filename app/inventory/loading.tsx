import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/Skeleton";

/** Skeleton screen for the Inventory & Price Monitoring page ( /inventory ) */
export default function InventoryLoading() {
  return (
    <AppShell>
      {/* PageHeader */}
      <div className="mb-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-[420px] max-w-full" />
      </div>

      {/* Price deviation chart card */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
        <Skeleton className="h-4 w-52" />
        <Skeleton className="mt-1 h-3 w-72 max-w-full" />
        <Skeleton className="mt-4 h-48 w-full rounded-xl" />
      </div>

      {/* Facility table card */}
      <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
        {/* Filters */}
        <div className="mb-4 flex gap-3">
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>

        {/* Table header */}
        <div className="grid grid-cols-8 gap-3 border-b border-slate-100 pb-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-full rounded" />
          ))}
        </div>

        {/* Table rows */}
        <div className="divide-y divide-slate-50">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-8 gap-3 py-3.5">
              {/* Facility name */}
              <Skeleton className="h-4 w-full col-span-2" />
              {/* District */}
              <Skeleton className="h-4 w-full" />
              {/* Crop */}
              <Skeleton className="h-4 w-14" />
              {/* Stock */}
              <Skeleton className="h-4 w-12" />
              {/* Capacity bar + % */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 w-16 rounded-full" />
                <Skeleton className="h-3.5 w-7" />
              </div>
              {/* Temp */}
              <Skeleton className="h-4 w-20" />
              {/* Risk badge */}
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

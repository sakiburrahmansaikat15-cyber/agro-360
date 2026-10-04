import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/Skeleton";

/** Skeleton screen for the Pilot Program page ( /pilot ) */
export default function PilotLoading() {
  return (
    <AppShell>
      {/* PageHeader */}
      <div className="mb-6">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="mt-2 h-4 w-[440px] max-w-full" />
      </div>

      {/* Roadmap + Scope — 3-col grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Roadmap timeline */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5 lg:col-span-2">
          <Skeleton className="h-4 w-44 mb-4" />
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                {/* Phase indicator */}
                <div className="flex flex-col items-center gap-1">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  {i < 3 && <Skeleton className="h-10 w-0.5 rounded-full" />}
                </div>
                {/* Phase detail */}
                <div className="flex-1 pb-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3.5 w-20" />
                  </div>
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pilot scope */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
          <Skeleton className="h-4 w-28 mb-4" />
          <ul className="space-y-3.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Targets card */}
      <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
        <Skeleton className="h-4 w-40 mb-4" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-100 p-4">
              <Skeleton className="h-3 w-32 mb-2" />
              <div className="flex items-end gap-3">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-5 w-12 rounded-full mb-0.5" />
              </div>
              <Skeleton className="mt-2 h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

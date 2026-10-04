import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Skeleton screen for the public consumer trace portal ( /trace ).
 * Uses the same standalone mobile-first layout as the actual page
 * (no sidebar, gradient background).
 */
export default function TraceLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-slate-50">
      <div className="mx-auto w-full max-w-md px-4 pb-10 pt-3">
        {/* Top bar */}
        <div className="flex items-center justify-between py-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>

        {/* Hero icon + heading */}
        <div className="mt-6 flex flex-col items-center text-center">
          <Skeleton className="h-20 w-20 rounded-3xl" />
          <Skeleton className="mt-5 h-7 w-56" />
          <Skeleton className="mt-2 h-4 w-64" />
          <Skeleton className="mt-1 h-4 w-48" />
        </div>

        {/* Search card */}
        <div className="mt-7 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="mt-3 h-12 w-full rounded-2xl" />
        </div>

        {/* Sample link */}
        <Skeleton className="mx-auto mt-4 h-4 w-52 rounded" />
      </div>
    </div>
  );
}

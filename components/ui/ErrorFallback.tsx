"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Reusable error display used by all route-level error.tsx boundaries.
 * Must be used within a "use client" context (error.tsx files are always client components).
 */
export function ErrorFallback({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 p-10 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-500">
        <AlertTriangle size={30} strokeWidth={1.75} />
      </span>

      <h2 className="mt-5 text-lg font-semibold text-red-800">
        Something went wrong
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-relaxed text-red-600">
        {error?.message ||
          "An unexpected error occurred while loading this page. Please try again."}
      </p>

      {error?.digest && (
        <p className="mt-2 font-mono text-[11px] text-red-400">
          Error ID: {error.digest}
        </p>
      )}

      <button
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:bg-red-700 active:scale-95"
      >
        <RefreshCw size={14} />
        Try again
      </button>
    </div>
  );
}

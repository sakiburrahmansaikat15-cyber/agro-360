"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Error boundary for the public /trace consumer portal.
 * Uses the standalone (no-sidebar) layout since the trace portal has its own layout.
 */
export default function TraceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-slate-50">
      <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center px-4 pt-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-500">
          <AlertTriangle size={30} strokeWidth={1.75} />
        </span>

        <h2 className="mt-5 text-lg font-semibold text-red-800">
          Something went wrong
        </h2>

        <p className="mt-2 max-w-xs text-sm leading-relaxed text-red-600">
          {error?.message ||
            "An unexpected error occurred. Please check the batch ID and try again."}
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
    </div>
  );
}

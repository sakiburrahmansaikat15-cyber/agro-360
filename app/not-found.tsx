import Link from "next/link";
import { Leaf, MoveLeft } from "lucide-react";

/** Shown when notFound() is called or a route segment doesn't exist. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      {/* Brand mark */}
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-200">
        <Leaf size={28} strokeWidth={1.75} />
      </span>

      {/* 404 number */}
      <p className="mt-6 text-[80px] font-bold leading-none tracking-tighter text-slate-200 select-none">
        404
      </p>

      {/* Message */}
      <h1 className="mt-2 text-xl font-semibold text-slate-800">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
        The page or batch ID you&apos;re looking for doesn&apos;t exist on the
        Agro-Trust 360 network. It may have been moved, or the link may be
        incorrect.
      </p>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          <MoveLeft size={15} />
          Back to dashboard
        </Link>
        <Link
          href="/trace"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Trace a batch
        </Link>
      </div>
    </div>
  );
}

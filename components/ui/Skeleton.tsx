import { clsx } from "clsx";

/**
 * Base shimmer block. Control size entirely via `className`.
 *
 * @example
 * <Skeleton className="h-4 w-32" />        // text-row placeholder
 * <Skeleton className="h-52 w-full rounded-xl" /> // chart placeholder
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx("animate-pulse rounded-lg bg-slate-200", className)}
    />
  );
}

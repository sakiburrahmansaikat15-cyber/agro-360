"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";

/**
 * Client-side route guard for admin-only pages.
 *
 * Note: this protects the UI/UX (redirects unauthenticated or non-admin
 * visitors away from admin screens) but is NOT the real security boundary —
 * that is enforced by the Postgres row-level security policies (see
 * supabase_migration_002_rbac.sql), which reject reads/writes from anyone
 * whose session doesn't carry app_metadata.role = "admin". A client guard
 * alone can always be bypassed by calling the API directly, so it must
 * never be the only line of defense.
 */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { session, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!session || !isAdmin) {
      const timer = setTimeout(() => {
        router.replace("/login");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [loading, session, isAdmin, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">
        Loading…
      </div>
    );
  }

  if (!session || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}

import { createClient } from "@supabase/supabase-js";

/**
 * Verifies that the caller's request carries a valid Supabase session
 * belonging to an admin account (app_metadata.role === "admin").
 *
 * app_metadata can only ever be set with the service-role key (see
 * scripts/create-admin.ts), never by the user themselves via
 * supabase.auth.updateUser(), so it is safe to trust as an authorization
 * signal here.
 *
 * Returns null if the caller is authorized, or a Response to return
 * immediately (401/403) if not.
 */
export async function requireAdmin(request: Request): Promise<Response | null> {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return Response.json({ error: "Missing Authorization header" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("requireAdmin: missing Supabase server configuration");
    return Response.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const supabaseAdmin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return Response.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  const role = (data.user.app_metadata as Record<string, unknown> | undefined)?.role;
  if (role !== "admin") {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }

  return null;
}

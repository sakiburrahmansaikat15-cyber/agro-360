/**
 * One-time provisioning script for Admin Portal accounts.
 *
 * There is no public admin sign-up flow by design — admin accounts are
 * created out-of-band by whoever holds the service-role key, with
 * app_metadata.role = "admin" set at creation time. app_metadata can only
 * ever be modified via the service-role Admin API (never by the user
 * themselves through supabase.auth.updateUser()), which is what makes it
 * safe to trust in RLS policies and in lib/api/requireAdmin.ts.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     npx tsx scripts/create-admin.ts admin@example.com "a-strong-password" "Admin Name"
 *
 * Or rely on .env.local (same as verify-users.js) by running from the
 * project root with no env vars set explicitly.
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

if (typeof (global as any).WebSocket === 'undefined') {
  (global as any).WebSocket = class DummyWebSocket {};
}

function loadEnvLocal() {
  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envLocalPath)) return;
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const [key, ...val] = line.split('=');
    if (key && val.length > 0 && !process.env[key.trim()]) {
      const v = val.join('=').trim().replace(/^["']|["']$/g, '');
      process.env[key.trim()] = v;
    }
  });
}

async function main() {
  loadEnvLocal();

  const [, , email, password, name] = process.argv;
  if (!email || !password) {
    console.error('Usage: npx tsx scripts/create-admin.ts <email> <password> [name]');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters.');
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const supabaseAdmin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: null as any },
  });

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: 'admin' },
    user_metadata: { name: name || email },
  });

  if (error) {
    console.error('❌ Failed to create admin user:', error.message);
    process.exit(1);
  }

  console.log(`✅ Admin account created: ${data.user?.email} (id: ${data.user?.id})`);
  console.log('   app_metadata.role = "admin" — this account can now sign in at /login.');
}

main();

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/requireAdmin';

export async function POST(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const { name, phone, password } = await request.json();

    if (!name || !phone || !password) {
      return NextResponse.json({ error: 'Missing required fields: name, phone, password' }, { status: 400 });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Service role key required — bypasses email confirmation
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Sanitize phone to make a valid email (same logic as admin panel + agent app)
    const sanitizedPhone = phone.trim().replace(/[^a-zA-Z0-9]/g, '');
    const email = `${sanitizedPhone}@agro-trust.com`;

    // Create Supabase Auth user with email_confirm: true (no confirmation email needed)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirms — agent can log in immediately
      app_metadata: { role: 'agent' },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user?.id;

    // Insert into agents table
    const { error: dbError } = await supabaseAdmin.from('agents').insert([{
      user_id: userId,
      name,
      phone: sanitizedPhone,
      status: 'ACTIVE',
    }]);

    if (dbError) {
      // Rollback: delete the auth user if DB insert fails
      if (userId) await supabaseAdmin.auth.admin.deleteUser(userId);
      console.error('DB error:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Agent "${name}" created successfully`,
      agent: { name, phone: sanitizedPhone, email },
    });

  } catch (err: any) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

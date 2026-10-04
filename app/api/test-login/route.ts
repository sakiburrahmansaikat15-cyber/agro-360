import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/requireAdmin';

export async function POST(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const { phone, password } = body ?? {};

    if (!phone || typeof phone !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Missing required fields: phone, password' }, { status: 400 });
    }

    const sanitizedPhone = phone.trim().replace(/[^a-zA-Z0-9]/g, '');
    const email = `${sanitizedPhone}@agro-trust.com`;

    // Test login using the anon client (same as agent app)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    // Immediately end the test session — this endpoint only checks whether
    // the credentials are valid, it should not leave a lingering session.
    if (data.session) {
      await supabase.auth.signOut();
    }

    return NextResponse.json({
      email_tried: email,
      success: !!data.session,
      error: error?.message || null,
      user_id: data.user?.id || null,
      email_confirmed: data.user?.email_confirmed_at || null,
    });
  } catch (err: any) {
    console.error('test-login error:', err);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

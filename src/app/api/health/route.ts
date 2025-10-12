// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs'; // use Node runtime (not edge)

const REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SITE_URL',
  'PLAID_CLIENT_ID',
  'PLAID_SECRET',
  'PLAID_ENV',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  // One of these two will exist; both is fine:
  // 'TWILIO_MESSAGING_SERVICE_SID' or 'TWILIO_PHONE_NUMBER'
];

export async function GET() {
  // 1) Check env presence
  const missing = REQUIRED.filter((k) => !process.env[k]);
  const hasTwilioSender =
    !!process.env.TWILIO_MESSAGING_SERVICE_SID || !!process.env.TWILIO_PHONE_NUMBER;

  // 2) Ping Supabase (simple select using service role)
  let supabaseOk = false;
  let supabaseError: string | null = null;
  try {
    const supa = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    // light read from an existing table; we only care that it returns successfully
    const { error } = await supa.from('users').select('id').limit(1);
    supabaseOk = !error;
    if (error) supabaseError = error.message;
  } catch (e: any) {
    supabaseOk = false;
    supabaseError = e?.message || String(e);
  }

  const status = {
    ok:
      missing.length === 0 &&
      hasTwilioSender &&
      supabaseOk,
    env: {
      missing,
      hasTwilioSender
    },
    checks: {
      supabaseOk,
      supabaseError
    }
  };

  // Never leak secrets; just show booleans + missing keys list.
  return NextResponse.json(status, { status: status.ok ? 200 : 500 });
}

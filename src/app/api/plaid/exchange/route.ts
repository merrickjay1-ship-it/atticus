// src/app/api/plaid/exchange/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// ---- helpers -----------------------------------------------------------------
function plaidClient() {
  const env = (process.env.PLAID_ENV || 'sandbox').toLowerCase() as keyof typeof PlaidEnvironments;
  const cfg = new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
        'PLAID-SECRET': process.env.PLAID_SECRET!,
      },
    },
  });
  return new PlaidApi(cfg);
}

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function userIdFrom(req: NextRequest) {
  return (
    req.headers.get('x-user-id')?.trim() ||
    process.env.PLAID_DEMO_USER_ID || // MUST be a valid UUID if your table column is uuid
    'demo-user'
  );
}

// ---- route -------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const public_token = body?.public_token as string | undefined;
    if (!public_token) {
      return NextResponse.json({ ok: false, error: 'public_token is required' }, { status: 400 });
    }

    const userId = userIdFrom(req);
    const plaid = plaidClient();
    const { data } = await plaid.itemPublicTokenExchange({ public_token });

    const access_token = data.access_token; // sensitive; never return to client
    const item_id = data.item_id;

    // Persist in Supabase
    const sb = supabaseAdmin();
    const { error } = await sb
      .from('plaid_items')
      .upsert({ user_id: userId, item_id, access_token }, { onConflict: 'item_id' });

    if (error) {
      console.error('plaid_items upsert error:', error);
      return NextResponse.json({ ok: false, error: 'Failed to save Plaid item' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, item_id }, { status: 200 });
  } catch (err: any) {
    const friendly =
      err?.response?.data?.error_message || err?.response?.data || err?.message || 'Exchange failed';
    console.error('Plaid exchange error:', friendly);
    return NextResponse.json({ ok: false, error: 'Exchange failed' }, { status: 500 });
  }
}

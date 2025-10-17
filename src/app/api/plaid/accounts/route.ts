// src/app/api/plaid/accounts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function plaidClient() {
  const env = (process.env.PLAID_ENV || 'sandbox').toLowerCase() as keyof typeof PlaidEnvironments;
  const cfg = new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: { headers: { 'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!, 'PLAID-SECRET': process.env.PLAID_SECRET! } },
  });
  return new PlaidApi(cfg);
}
function supabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}
function userIdFrom(req: NextRequest) {
  return req.headers.get('x-user-id')?.trim() || process.env.PLAID_DEMO_USER_ID || 'demo-user';
}

export async function GET(req: NextRequest) {
  try {
    const userId = userIdFrom(req);
    const sb = supabaseAdmin();
    const { data: items, error } = await sb
      .from('plaid_items')
      .select('access_token, item_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (error || !items?.access_token) {
      return NextResponse.json({ ok: false, error: 'No linked items for this user' }, { status: 404 });
    }
    const plaid = plaidClient();
    const { data } = await plaid.accountsGet({ access_token: items.access_token });

    return NextResponse.json({ ok: true, item_id: items.item_id, accounts: data.accounts }, { status: 200 });
  } catch (err: any) {
    console.error('accounts error:', err?.response?.data || err?.message || err);
    return NextResponse.json({ ok: false, error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

// src/app/api/plaid/item/remove/route.ts
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

export async function POST(req: NextRequest) {
  try {
    const { item_id } = await req.json();
    if (!item_id) return NextResponse.json({ ok: false, error: 'item_id required' }, { status: 400 });

    const sb = supabaseAdmin();
    const userId = userIdFrom(req);
    const { data: row } = await sb
      .from('plaid_items')
      .select('access_token')
      .eq('user_id', userId)
      .eq('item_id', item_id)
      .maybeSingle();

    if (!row?.access_token) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

    const plaid = plaidClient();
    await plaid.itemRemove({ access_token: row.access_token });

    await sb.from('plaid_items').delete().eq('user_id', userId).eq('item_id', item_id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error('item/remove error:', err?.response?.data || err?.message || err);
    return NextResponse.json({ ok: false, error: 'Failed to remove item' }, { status: 500 });
  }
}

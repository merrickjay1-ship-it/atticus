// src/app/api/plaid/transactions/route.ts
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
    const days = Number(new URL(req.url).searchParams.get('days') ?? 30);
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - Math.max(1, days));
    const start_date = start.toISOString().slice(0, 10);
    const end_date = end.toISOString().slice(0, 10);

    const userId = userIdFrom(req);
    const sb = supabaseAdmin();
    const { data: items } = await sb
      .from('plaid_items')
      .select('access_token')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (!items?.access_token) {
      return NextResponse.json({ ok: false, error: 'No linked items for this user' }, { status: 404 });
    }

    const plaid = plaidClient();
    const { data } = await plaid.transactionsGet({
      access_token: items.access_token,
      start_date,
      end_date,
      options: { count: 100, offset: 0 },
    });

    return NextResponse.json({ ok: true, total: data.total_transactions, transactions: data.transactions }, { status: 200 });
  } catch (err: any) {
    console.error('transactions error:', err?.response?.data || err?.message || err);
    return NextResponse.json({ ok: false, error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

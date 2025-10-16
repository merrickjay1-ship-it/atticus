// src/app/api/plaid/exchange/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

export const runtime = 'nodejs';

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

export async function POST(req: NextRequest) {
  try {
    const { public_token } = await req.json();
    if (!public_token) {
      return NextResponse.json({ error: 'public_token is required' }, { status: 400 });
    }

    const plaid = plaidClient();
    const { data } = await plaid.itemPublicTokenExchange({ public_token });

    // In a later step: save data.access_token + data.item_id to Supabase (plaid_items)
    // For now: just return them so we can see the happy path.
    return NextResponse.json(
      { ok: true, item_id: data.item_id, access_token: data.access_token },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.response?.data || e?.message }, { status: 500 });
  }
}

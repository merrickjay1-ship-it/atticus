// src/app/api/plaid/exchange/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

/**
 * Build a Plaid client from env.
 */
function getPlaidClient() {
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

/**
 * Server-side Supabase (service role) — only safe to use in server routes.
 * We use this to persist the Plaid item. Don't ever expose this key to the browser.
 */
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
    global: { headers: { 'X-Client-Info': 'atticus-plaid-exchange' } },
  });
}

/**
 * Minimal shape we’ll save. Adjust to match your existing table columns if needed.
 * Expected table: public.plaid_items (user_id uuid, item_id text, access_token text, created_at timestamptz default now())
 */
type SaveItemRow = {
  user_id: string;
  item_id: string;
  access_token: string;
};

export async function POST(req: NextRequest) {
  try {
    // ---- 1) Validate input ---------------------------------------------------
    const body = await req.json().catch(() => ({}));
    const public_token: unknown = body?.public_token;

    if (!public_token || typeof public_token !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'public_token is required' },
        { status: 400 }
      );
    }

    // Where do we get the user? For now we accept an optional header you can set
    // from the client while you’re still wiring auth. Falls back to 'demo-user'.
    // Later, replace with your real authenticated user id.
    const userId =
      req.headers.get('x-user-id')?.trim() ||
      process.env.PLAID_DEMO_USER_ID ||
      'demo-user';

    // ---- 2) Exchange token with Plaid ----------------------------------------
    const plaid = getPlaidClient();
    const { data } = await plaid.itemPublicTokenExchange({ public_token });

    // data.access_token is sensitive — do NOT send it back to the browser.
    const access_token = data.access_token;
    const item_id = data.item_id;

    // ---- 3) Persist to Supabase ----------------------------------------------
    const supabase = getSupabaseAdmin();

    // Upsert so repeated connects don’t error (unique by item_id if you set that constraint)
    const row: SaveItemRow = { user_id: userId, item_id, access_token };

    const { error: dbError } = await supabase
      .from('plaid_items')
      .upsert(row, { onConflict: 'item_id' });

    if (dbError) {
      // If the DB fails, we still don’t leak the access_token in the response.
      console.error('plaid_items upsert error:', dbError);
      return NextResponse.json(
        { ok: false, error: 'Failed to save Plaid item' },
        { status: 500 }
      );
    }

    // ---- 4) Respond (no secrets) ---------------------------------------------
    return NextResponse.json(
      { ok: true, item_id },
      { status: 200 }
    );
  } catch (err: any) {
    // Plaid errors often include response.data; keep logs server-side only.
    const friendly =
      err?.response?.data?.error_message ||
      err?.response?.data ||
      err?.message ||
      'Plaid exchange failed';

    console.error('Plaid exchange error:', friendly);
    return NextResponse.json(
      { ok: false, error: 'Exchange failed' },
      { status: 500 }
    );
  }
}

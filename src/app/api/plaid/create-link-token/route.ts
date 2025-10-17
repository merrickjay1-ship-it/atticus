// src/app/api/plaid/create-link-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
  LinkTokenCreateRequest,
} from 'plaid';

export const runtime = 'nodejs';

// ---- helpers (local, no separate utils needed) ------------------------------
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

function userIdFrom(req: NextRequest) {
  // While we wire auth, we allow an override and default to a demo user.
  return (
    req.headers.get('x-user-id')?.trim() ||
    process.env.PLAID_DEMO_USER_ID ||           // <— set this to your Supabase users.id UUID
    'demo-user'
  );
}

function absoluteUrl(req: NextRequest, path: string) {
  // Prefer Vercel/XFH headers; fall back to production domain.
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host =
    req.headers.get('x-forwarded-host') ||
    req.headers.get('host') ||
    'atticusfamilyoffice.com';
  return `${proto}://${host}${path}`;
}

// ---- route -------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const plaid = plaidClient();
    const client_user_id = userIdFrom(req);

    const payload: LinkTokenCreateRequest = {
      user: { client_user_id },
      client_name: process.env.NEXT_PUBLIC_APP_NAME || 'Atticus',
      products: [Products.Transactions],          // start small; add Products.Auth later
      country_codes: [CountryCode.Us],
      language: 'en',
      // A webhook is optional but useful once you start syncing.
      webhook: absoluteUrl(req, '/api/plaid/webhook'),
      // If/when you enable OAuth institutions later, set PLAID_REDIRECT_URI in Vercel:
      // redirect_uri: process.env.PLAID_REDIRECT_URI,
    };

    const { data } = await plaid.linkTokenCreate(payload);
    return NextResponse.json({ ok: true, link_token: data.link_token }, { status: 200 });
  } catch (e: any) {
    // Keep details server-side; the client just needs "it failed".
    console.error('create-link-token error:', e?.response?.data || e?.message || e);
    return NextResponse.json({ ok: false, error: 'Failed to create link token' }, { status: 500 });
  }
}

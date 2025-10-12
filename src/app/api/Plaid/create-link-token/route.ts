// src/app/api/plaid/create-link-token/route.ts
import { NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

export const runtime = 'nodejs';

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

export async function GET() {
  try {
    // In a real app, set client_user_id to the authenticated user's ID.
    // For now, a stable placeholder is fine.
    const client_user_id = 'demo-user';

    const plaid = getPlaidClient();
    const request = {
      user: { client_user_id },
      client_name: 'Atticus',
      products: ['transactions'] as const,
      country_codes: ['US'] as const,
      language: 'en',
      // If you later add OAuth institutions, set PLAID_REDIRECT_URI and include it here.
      // redirect_uri: process.env.PLAID_REDIRECT_URI,
    };

    const { data } = await plaid.linkTokenCreate(request);
    return NextResponse.json({ link_token: data.link_token }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.response?.data || e?.message || 'plaid error' },
      { status: 500 }
    );
  }
}

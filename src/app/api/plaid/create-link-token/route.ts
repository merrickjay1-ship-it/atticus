// src/app/api/plaid/create-link-token/route.ts
import { NextResponse } from 'next/server';
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
  LinkTokenCreateRequest,
} from 'plaid';

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
    // TODO: swap with the real authenticated user's id later
    const client_user_id = 'demo-user';

    const request: LinkTokenCreateRequest = {
      user: { client_user_id },
      client_name: 'Atticus',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
      // If/when you enable OAuth institutions, set PLAID_REDIRECT_URI in Vercel
      // and then uncomment the next line:
      // redirect_uri: process.env.PLAID_REDIRECT_URI,
    };

    const plaid = getPlaidClient();
    const { data } = await plaid.linkTokenCreate(request);

    return NextResponse.json({ link_token: data.link_token }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.response?.data || e?.message || 'plaid error' },
      { status: 500 }
    );
  }
}

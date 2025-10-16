// src/app/api/plaid/create-link-token/route.ts
import { jsonErr, jsonOK, plaidClient, userIdFrom, env } from '../../_lib/utils';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const userId = userIdFrom(req);
    const plaid = plaidClient();

    const payload: any = {
      user: { client_user_id: userId },
      client_name: env.APP_NAME(),
      products: ['transactions'],               // start small; add 'auth' later if needed
      country_codes: ['US'],
      language: 'en',
    };

    // Optional OAuth redirect URI if you plan to support OAuth institutions later
    const redirect = env.PLAID_REDIRECT_URI();
    if (redirect) payload.redirect_uri = redirect;

    const { data } = await plaid.linkTokenCreate(payload);
    return jsonOK({ ok: true, link_token: data.link_token });
  } catch (err: any) {
    console.error('create-link-token error:', err?.response?.data || err?.message || err);
    return jsonErr('Failed to create link token', 500);
  }
}

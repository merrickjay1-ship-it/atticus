// src/app/api/plaid/accounts/route.ts
import { jsonErr, jsonOK, getItemRowForUser, plaidClient, userIdFrom } from '../../_lib/utils';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const userId = userIdFrom(req);
    const url = new URL(req.url);
    const itemId = url.searchParams.get('item_id');

    const itemRow = await getItemRowForUser(userId, itemId);
    if (!itemRow) return jsonErr('No Plaid item found for user', 404);

    const plaid = plaidClient();
    const { data } = await plaid.accountsGet({ access_token: itemRow.access_token });

    // Return de-identified fields only
    const accounts = data.accounts.map(a => ({
      account_id: a.account_id,
      name: a.name || a.official_name,
      type: a.type,
      subtype: a.subtype,
      mask: a.mask,
      balances: {
        available: a.balances.available ?? null,
        current: a.balances.current ?? null,
        iso_currency_code: a.balances.iso_currency_code ?? null,
      },
    }));

    return jsonOK({ ok: true, item_id: itemRow.item_id, accounts });
  } catch (err: any) {
    console.error('accounts error:', err?.response?.data || err?.message || err);
    return jsonErr('Failed to fetch accounts', 500);
  }
}

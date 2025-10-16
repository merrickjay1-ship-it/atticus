// src/app/api/plaid/item/remove/route.ts
import { jsonErr, jsonOK, getItemRowForUser, plaidClient, supabaseAdmin, userIdFrom } from '../../../api/_lib/utils';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const userId = userIdFrom(req);
    const body = await req.json().catch(() => ({}));
    const item_id = body?.item_id as string | undefined;
    if (!item_id) return jsonErr('item_id is required', 400);

    const itemRow = await getItemRowForUser(userId, item_id);
    if (!itemRow) return jsonErr('Item not found', 404);

    const plaid = plaidClient();
    await plaid.itemRemove({ access_token: itemRow.access_token });

    const sb = supabaseAdmin();
    await sb.from('plaid_items').delete().eq('item_id', itemRow.item_id).eq('user_id', userId);

    return jsonOK({ ok: true, item_id: itemRow.item_id });
  } catch (err: any) {
    console.error('item/remove error:', err?.response?.data || err?.message || err);
    return jsonErr('Failed to remove item', 500);
  }
}

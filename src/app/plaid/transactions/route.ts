// src/app/api/plaid/transactions/route.ts
import { jsonErr, jsonOK, getItemRowForUser, plaidClient, userIdFrom } from '../../_lib/utils';

export const runtime = 'nodejs';

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  try {
    const userId = userIdFrom(req);
    const url = new URL(req.url);
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    const itemId = url.searchParams.get('item_id');

    // Default to last 30 days
    const endDate = end || iso(new Date());
    const startDate =
      start ||
      iso(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    const itemRow = await getItemRowForUser(userId, itemId);
    if (!itemRow) return jsonErr('No Plaid item found for user', 404);

    const plaid = plaidClient();
    const { data } = await plaid.transactionsGet({
      access_token: itemRow.access_token,
      start_date: startDate,
      end_date: endDate,
      options: {
        count: 100,
        include_personal_finance_category: true,
      },
    });

    // Sanitize
    const txns = data.transactions.map(t => ({
      transaction_id: t.transaction_id,
      account_id: t.account_id,
      name: t.name,
      date: t.date,
      amount: t.amount,
      iso_currency_code: t.iso_currency_code,
      category: t.category,
      personal_finance_category: t.personal_finance_category?.primary,
      merchant_name: t.merchant_name,
      pending: t.pending,
    }));

    return jsonOK({
      ok: true,
      item_id: itemRow.item_id,
      total: txns.length,
      transactions: txns,
      request_id: data.request_id,
      // next_cursor can be added later for incremental sync
    });
  } catch (err: any) {
    console.error('transactions error:', err?.response?.data || err?.message || err);
    return jsonErr('Failed to fetch transactions', 500);
  }
}

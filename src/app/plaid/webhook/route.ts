// src/app/api/plaid/webhook/route.ts
import { jsonOK } from 'from '../../api/_lib/utils'
';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  console.log('PLAID WEBHOOK:', JSON.stringify(body, null, 2));
  // Respond 200 so Plaid is happy
  return jsonOK({ ok: true });
}

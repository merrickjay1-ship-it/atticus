// src/app/plaid/webhook/route.ts
import { jsonOK } from "../../api/_lib/utils";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  console.log("PLAID WEBHOOK:", JSON.stringify(body, null, 2));
  return jsonOK({ ok: true });
}

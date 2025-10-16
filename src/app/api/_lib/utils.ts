// src/app/api/_lib/utils.ts
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { createClient } from '@supabase/supabase-js';

type SafeAny = any;

export const runtime = 'nodejs'; // For consistency if imported directly

/** Minimal JSON helpers */
export function jsonOK(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
export function jsonErr(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ ok: false, error: message, ...extra }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** Read required envs lazily to avoid build-time explosions */
function must(key: string): string {
  const v = process.env[key];
  if (!v || v.length === 0) {
    throw new Error(`Missing required env: ${key}`);
  }
  return v;
}

export const env = {
  SUPABASE_URL: () => must('NEXT_PUBLIC_SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: () => must('SUPABASE_SERVICE_ROLE_KEY'),
  PLAID_ENV: () => (process.env.PLAID_ENV || 'sandbox').toLowerCase(),
  PLAID_CLIENT_ID: () => must('PLAID_CLIENT_ID'),
  PLAID_SECRET: () => must('PLAID_SECRET'),
  PLAID_REDIRECT_URI: () => process.env.PLAID_REDIRECT_URI, // optional
  APP_NAME: () => process.env.NEXT_PUBLIC_APP_NAME || 'Atticus',
};

/** Server-side Supabase admin (service role) — only in API routes. */
export function supabaseAdmin() {
  return createClient(env.SUPABASE_URL(), env.SUPABASE_SERVICE_ROLE_KEY(), {
    auth: { persistSession: false },
    global: { headers: { 'X-Client-Info': 'atticus-api' } },
  });
}

/** Plaid client from env */
export function plaidClient(): PlaidApi {
  const cfg = new Configuration({
    basePath: PlaidEnvironments[env.PLAID_ENV() as keyof typeof PlaidEnvironments],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': env.PLAID_CLIENT_ID(),
        'PLAID-SECRET': env.PLAID_SECRET(),
      },
    },
  });
  return new PlaidApi(cfg);
}

/** Temporary user resolver.
 *  Until you wire real auth, pass `X-User-Id` from the client (or set PLAID_DEMO_USER_ID).
 */
export function userIdFrom(req: Request): string {
  return (
    req.headers.get('x-user-id')?.trim() ||
    process.env.PLAID_DEMO_USER_ID ||
    'demo-user'
  );
}

/** Get the most recent plaid_items row for the user (or by item_id) */
export async function getItemRowForUser(userId: string, itemId?: string | null) {
  const sb = supabaseAdmin();
  let q = sb.from('plaid_items').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1);
  if (itemId) q = q.eq('item_id', itemId);
  const { data, error } = await q;
  if (error) throw error;
  return data?.[0] as SafeAny | undefined;
}

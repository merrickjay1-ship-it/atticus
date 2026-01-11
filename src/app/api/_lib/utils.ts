// src/app/api/_lib/utils.ts
import { NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { createClient } from '@supabase/supabase-js';

/* ------------------------- tiny JSON helpers ------------------------- */
export function jsonOK<T extends object>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
export function jsonErr(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/* ------------------------- env helpers (safe) ------------------------ */
export const env = {
  APP_NAME: () => process.env.NEXT_PUBLIC_APP_NAME || 'Atticus',
  PLAID_ENV: () => (process.env.PLAID_ENV || 'sandbox').toLowerCase(),
  PLAID_REDIRECT_URI: () => process.env.PLAID_REDIRECT_URI || '',
  DEMO_USER_ID: () => process.env.PLAID_DEMO_USER_ID || 'demo-user',
  SUPABASE_URL: () => process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_SERVICE_KEY: () => process.env.SUPABASE_SERVICE_ROLE_KEY!,
  PLAID_CLIENT_ID: () => process.env.PLAID_CLIENT_ID!,
  PLAID_SECRET: () => process.env.PLAID_SECRET!,
};

/* ---------------------- Plaid server-side client --------------------- */
export function plaidClient() {
  const e = env.PLAID_ENV() as keyof typeof PlaidEnvironments;
  const cfg = new Configuration({
    basePath: PlaidEnvironments[e],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': env.PLAID_CLIENT_ID(),
        'PLAID-SECRET': env.PLAID_SECRET(),
      },
    },
  });
  return new PlaidApi(cfg);
}

/* -------------- Supabase service-role (server-only) ------------------ */
export function supabaseAdmin() {
  const url = env.SUPABASE_URL();
  const key = env.SUPABASE_SERVICE_KEY();
  return createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: { 'X-Client-Info': 'atticus-api' } },
  });
}

/* ----------------- get a user id (temporary helper) ------------------ */
export function userIdFrom(req: Request) {
  // while auth is WIP, accept an optional header; else demo user
  const h = (req.headers.get('x-user-id') || '').trim();
  return h || env.DEMO_USER_ID();
}
// --- Plaid helpers ---

import { createClient } from "@supabase/supabase-js";

export async function getItemRowForUser(userId: string, itemId: string | null) {
  if (!itemId) return null;

  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) / SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("plaid_items")
    .select("*")
    .eq("user_id", userId)
    .eq("item_id", itemId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

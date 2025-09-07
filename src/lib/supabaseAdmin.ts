// src/lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

// Supabase URL & Service Role key from your .env.local
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE!; // SERVICE ROLE — keep this server-side only

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: {
    persistSession: false,    // don’t persist sessions in a server context
    autoRefreshToken: false,  // no need to auto-refresh on server
  },
});

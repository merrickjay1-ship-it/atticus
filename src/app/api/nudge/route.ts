// /app/api/nudge/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Twilio } from "twilio";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  // Admin guard
  const adminKey = req.headers.get("x-admin-key");
  if (!adminKey || adminKey !== process.env.NUDGE_ADMIN_KEY) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Env values (must be set in Vercel + your .env.local)
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const serviceSid = process.env.TWILIO_MESSAGING_SERVICE_SID!;
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supaSvc = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const client = new Twilio(accountSid, authToken);
  const supabase = createClient(supaUrl, supaSvc);

  // Optional custom body
  const { body: custom } = await req.json().catch(() => ({ body: "" }));
  const message =
    (custom || "").trim() ||
    "Hey, it’s Atticus 👋 Quick 30-sec check-in. Any unusual expenses last week? Reply NONE or send a note/photo.";

  // Pull phone numbers from users table
  const { data: users, error } = await supabase
    .from("users")
    .select("phone")
    .not("phone", "is", null)
    .limit(200);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const results: any[] = [];
  for (const u of users || []) {
    try {
      // NOTE: Outbound will fail until your Toll-Free / A2P registration is approved.
      const resp = await client.messages.create({
        messagingServiceSid: serviceSid,
        to: u.phone as string,
        body: message,
      });
      results.push({ to: u.phone, sid: resp.sid, status: resp.status });
    } catch (e: any) {
      results.push({ to: u.phone, error: e?.message || "send failed" });
    }
  }

  return NextResponse.json({ ok: true, sent: results.length, results });
}

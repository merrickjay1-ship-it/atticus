import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  // Read envs at request-time only (prevents build-time crash)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json(
      { ok: false, error: "Missing Supabase envs" },
      { status: 500 }
    );
  }

  const supabase = createClient(url, serviceKey);

  // Twilio sends application/x-www-form-urlencoded
  const form = await req.formData();
  const from = (form.get("From") as string) || "";
  const body = (form.get("Body") as string) || "";
  const mediaCount = parseInt((form.get("NumMedia") as string) || "0", 10);

  // Upsert user by phone
  if (from) {
    await supabase.from("users").upsert(
      { phone: from },
      { onConflict: "phone" }
    );
  }

  // Log the inbound message
  await supabase.from("sms_logs").insert({
    phone: from,
    body,
    direction: "inbound",
  });

  // Record a "check-in" (MVP)
  await supabase.from("checkins").insert({
    phone: from,
    body,
    direction: "inbound",
    media_count: mediaCount,
  });

  // Auto-reply via TwiML so Twilio sends the SMS back to the user
  const reply =
    "Hey, it’s AIVA 👋 You’re in. I’ll send tiny money check-ins, nothing spammy. Reply STOP to opt out.";

  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${reply}</Message></Response>`;
  return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
}

export async function GET() {
  // Health check (used by you + Vercel)
  return NextResponse.json({ ok: true });
}

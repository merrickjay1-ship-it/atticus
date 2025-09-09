import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
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

  // ✅ This matches your sms_logs definition (direction + payload jsonb)
  const payload = Object.fromEntries(form.entries());
  const { error: logErr } = await supabase.from("sms_logs").insert({
    direction: "inbound",
    payload: {
      from,
      body,
      mediaCount,
      raw: payload,
      receivedAt: new Date().toISOString(),
    },
  });
  if (logErr) {
    console.error("sms_logs insert error", logErr);
  }

  // (We’ll wire checkins/users after we confirm column names.)

  // TwiML auto-reply
  const reply =
    "Hey, it’s AIVA 👋 You’re in. I’ll send tiny money check-ins, nothing spammy. Reply STOP to opt out.";
  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${reply}</Message></Response>`;
  return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
}

// Health check
export async function GET() {
  return NextResponse.json({ ok: true });
}

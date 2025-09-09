import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server key
);

export async function POST(req: Request) {
  // Twilio sends x-www-form-urlencoded
  const form = await req.formData();

  const from = (form.get("From") as string) || "";
  const body = (form.get("Body") as string) || "";
  const numMedia = parseInt((form.get("NumMedia") as string) || "0", 10);
  const mediaUrl0 = numMedia > 0 ? (form.get("MediaUrl0") as string) : null;

  // Log raw payload for debugging
  const payload: Record<string, string> = {};
  for (const [k, v] of form.entries()) payload[k] = String(v);
  await supabase.from("sms_logs").insert({ direction: "inbound", payload });

  if (!from) return new Response("Missing From", { status: 400 });

  // Upsert user by phone
  const { data: userRow, error: userErr } = await supabase
    .from("users")
    .upsert({ phone: from }, { onConflict: "phone" })
    .select("id")
    .single();

  if (userErr || !userRow) {
    return NextResponse.json(
      { ok: false, error: userErr?.message || "Could not upsert user" },
      { status: 500 }
    );
  }

  // Insert check-in
  const { error: checkinErr } = await supabase.from("checkins").insert({
    user_id: userRow.id,
    body,
    media_url: mediaUrl0,
  });
  if (checkinErr) {
    return NextResponse.json({ ok: false, error: checkinErr.message }, { status: 500 });
  }

  // Simple auto-reply (we'll personalize later)
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Hey, it’s AIVA 👋 You’re in. I’ll send tiny money check-ins, nothing spammy. Reply STOP to opt out.</Message>
</Response>`;
  return new Response(twiml, { headers: { "Content-Type": "application/xml" } });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

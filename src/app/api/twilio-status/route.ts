// /app/api/twilio-status/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Health check: GET /api/twilio-status  -> { ok: true }
export async function GET() {
  return NextResponse.json({ ok: true });
}

// Twilio status callback: POST x-www-form-urlencoded
export async function POST(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase envs" },
        { status: 500 }
      );
    }

    const supabase = createClient(url, serviceKey);

    // Twilio posts form-encoded data
    const raw = await req.text();
    const params = new URLSearchParams(raw);
    const payload = Object.fromEntries(params.entries());

    const row = {
      message_sid: params.get("MessageSid"),
      to_number: params.get("To"),
      from_number: params.get("From"),
      message_status: params.get("MessageStatus"),
      error_code: params.get("ErrorCode"),
      payload,
    };

    const { error } = await supabase.from("sms_statuses").insert(row);
    if (error) console.error("sms_statuses insert error", error);

    // Twilio only needs a 2xx. Plain 200 OK is fine.
    return new Response("OK", { status: 200 });
  } catch (e) {
    console.error("twilio-status POST error", e);
    return new Response("OK", { status: 200 });
  }
}

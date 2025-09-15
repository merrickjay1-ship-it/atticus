export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Twilio Status Callback (x-www-form-urlencoded)
 * Logs delivery events like queued/sent/delivered/undelivered/failed.
 */
export async function POST(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json({ ok: false, error: "Missing Supabase envs" }, { status: 500 });
    }

    // Parse form-urlencoded body
    const raw = await req.text();
    const params = new URLSearchParams(raw);

    const row = {
      message_sid: params.get("MessageSid") ?? null,
      to_number: params.get("To") ?? null,
      from_number: params.get("From") ?? null,
      message_status: params.get("MessageStatus") ?? null, // queued|sent|delivered|undelivered|failed
      error_code: params.get("ErrorCode") ?? null,
      payload: Object.fromEntries(params.entries()),
      created_at: new Date().toISOString(),
    };

    const supabase = createClient(url, serviceKey);
    const { error } = await supabase.from("sms_statuses").insert(row);
    if (error) console.error("sms_statuses insert error", error);

    // Twilio expects 2xx quickly
    return new Response("", { status: 200 });
  } catch (e) {
    console.error("twilio-status POST error", e);
    return new Response("", { status: 200 });
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ ok: true });
}

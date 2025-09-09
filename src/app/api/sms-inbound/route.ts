import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Twilio posts x-www-form-urlencoded.
 * We parse it, insert a row into sms_logs (id, direction, payload, created_at),
 * and return TwiML so the user gets an auto-reply.
 */
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

    // Create Supabase admin client at request time
    const supabase = createClient(url, serviceKey);

    // Parse x-www-form-urlencoded body from Twilio
    const raw = await req.text();
    const params = new URLSearchParams(raw);

    const from = params.get("From") ?? "";
    const body = params.get("Body") ?? "";
    const mediaCount = Number(params.get("NumMedia") ?? "0");

    // Row matches your sms_logs table structure
    const row = {
      id: crypto.randomUUID(),
      direction: "inbound" as const,
      payload: {
        from,
        body,
        mediaCount,
        raw: Object.fromEntries(params.entries()),
        receivedAt: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("sms_logs").insert(row);
    if (error) {
      // don't fail the reply; just log to Vercel function logs
      console.error("sms_logs insert error", error);
    }

    // Friendly auto-reply (brand: Atticus)
    const reply =
      "Hey, it’s Atticus 👋 You’re in. I’ll send check-ins from time to time dependent on your selections. Reply STOP to opt out.";
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${reply}</Message></Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
  } catch (e) {
    console.error("sms-inbound POST error", e);
    // Return 200 with empty TwiML to avoid Twilio retry storms
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
  }
}

// Simple health check
export async function GET() {
  return NextResponse.json({ ok: true });
}

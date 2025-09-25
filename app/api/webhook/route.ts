import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Required so we can read the raw body for signature verification
export const runtime = "nodejs";

async function getRawBody(req: NextRequest): Promise<Buffer> {
  const buf = await req.arrayBuffer();
  return Buffer.from(buf);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return new NextResponse("Missing signature or secret", { status: 400 });
  }

  let event: Stripe.Event;

  // Verify Stripe signature using the raw body
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: unknown) {
    const msg = (err as Error)?.message || "unknown error";
    console.error("Webhook signature verification failed:", msg);
    return new NextResponse("Bad signature", { status: 400 });
  }

  // Minimal handler: just log the event type for now
  try {
    console.log("Stripe event received:", event.type);
  } catch (err: unknown) {
    const msg = (err as Error)?.message || "unknown error";
    console.error("Handler error:", msg);
    return new NextResponse("Handler error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}

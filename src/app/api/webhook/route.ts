import { NextResponse } from "next/server";
import Stripe from "stripe";

// Stripe posts signed JSON; we verify the signature using the raw body.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const whsec = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret || !whsec) {
    return NextResponse.json(
      { ok: false, error: "Missing Stripe envs" },
      { status: 500 }
    );
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json(
      { ok: false, error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const stripe = new Stripe(secret);

  // IMPORTANT: use the raw body string for signature verification
  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, whsec);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: `Signature verification failed: ${msg}` },
      { status: 400 }
    );
  }

  // Handle only what you need for now; expand later.
  // e.g., "checkout.session.completed", "invoice.paid", etc.
  switch (event.type) {
    case "checkout.session.completed":
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "invoice.paid":
    case "invoice.payment_failed":
      // TODO: enqueue a job or write to DB here (create Supabase client INSIDE this block if needed)
      break;
    default:
      // ignore others for now
      break;
  }

  return NextResponse.json({ ok: true, type: event.type });
}

// Simple health check to avoid build-time crashes
export async function GET() {
  return NextResponse.json({ ok: true });
}

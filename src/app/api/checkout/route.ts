import { NextResponse } from "next/server";
import Stripe from "stripe";

function getBaseUrl() {
  // Prefer Vercel-provided domain in production; fall back to local
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "Missing STRIPE_SECRET_KEY" },
      { status: 500 }
    );
  }

  // Create the Stripe client at request time (prevents build-time crash)
  const stripe = new Stripe(secret);

  // Accept priceId from the request body or default to Founders
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // no body provided is fine
  }
  const priceId =
    body?.priceId ??
    process.env.NEXT_PUBLIC_PRICE_ID_FOUNDERS ??
    null;

  if (!priceId) {
    return NextResponse.json(
      { ok: false, error: "Missing priceId (and no default set)" },
      { status: 400 }
    );
  }

  const base = getBaseUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/success`,
    cancel_url: `${base}/cancel`,
    allow_promotion_codes: true,
  });

  // Redirect the client straight to Stripe Checkout
  return NextResponse.redirect(session.url!, { status: 303 });
}

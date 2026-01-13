import { NextResponse } from "next/server";
import Stripe from "stripe";

function getBaseUrl() {
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

  const stripe = new Stripe(secret);

  // Read body safely
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const priceId =
    body?.priceId ?? process.env.NEXT_PUBLIC_PRICE_ID_FOUNDERS ?? null;

  if (!priceId) {
    return NextResponse.json(
      { ok: false, error: "Missing priceId (and no default set)" },
      { status: 400 }
    );
  }

  const base = getBaseUrl();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/success`,
      cancel_url: `${base}/cancel`,
      allow_promotion_codes: true,

      // keeps things future-proof for webhook → Supabase mapping later
      metadata: { priceId },
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Stripe error" },
      { status: 500 }
    );
  }
}

// Health check (super useful for quick verification)
export async function GET() {
  return NextResponse.json({ ok: true });
}

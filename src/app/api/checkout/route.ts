/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { priceId } = await req.json();

  try {
    const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  line_items: [{ price: priceId, quantity: 1 }],
  // ❌ remove customer_creation (not allowed in subscription mode)
  // customer_creation: "always",
  // You can optionally prefill an email (else Checkout will collect it)
  // customer_email: undefined,
  success_url: "http://localhost:3000/success",
  cancel_url: "http://localhost:3000/cancel",
});


    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs"; // required for raw body

async function getRawBody(req: NextRequest) {
  const buf = await req.arrayBuffer();
  return Buffer.from(buf);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return new NextResponse("Missing signature or secret", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: unknown) {
    console.error(
      "❌ Webhook signature verification failed:",
      (err as Error).message
    );
    return new NextResponse("Bad signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("✅ checkout.session.completed", session.id);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("✅ invoice.paid", invoice.id);
        break;
      }
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        console.log("✅ subscription.created", sub.id);
        break;
      }
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log("✅ payment_intent.succeeded", pi.id);
        break;
      }
      default:
        console.log(`ℹ️ Unhandled event: ${event.type}`);
    }
  } catch (err: unknown) {
    console.error("⚠️ Handler error:", (err as Error).message);
    return new NextResponse("Handler error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}

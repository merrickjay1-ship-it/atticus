/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { NextResponse } from "next/server";
// If your alias "@" points to ./src (the default), this import will work.
// Otherwise change it to a relative path like: "../../../lib/supabaseAdmin"
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !whSecret) {
    return NextResponse.json(
      { error: "Missing stripe-signature or STRIPE_WEBHOOK_SECRET" },
      { status: 400 }
    );
  }

  // IMPORTANT: get the raw body for Stripe signature verification
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, whSecret);
  } catch (err: any) {
    console.error("❌ Invalid webhook signature:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const customerId =
          typeof session.customer === "string" ? session.customer : null;
        const email = session.customer_details?.email ?? null;
        const phone = session.customer_details?.phone ?? null;

        // breadcrumb for debugging
        try {
          await supabaseAdmin.from("events").insert({
            event_type: event.type,
            payload: session as any,
          });
        } catch (e) {
          console.error("events insert error:", e);
        }

        // build updates for users table
        const updates: Record<string, any> = {};
        if (customerId) updates.stripe_customer_id = customerId;
        if (email) updates.email = email;
        if (phone) updates.phone = phone;

        try {
          if (phone) {
            // update the row you inserted earlier by phone
            await supabaseAdmin.from("users").update(updates).eq("phone", phone);
          } else if (email) {
            await supabaseAdmin.from("users").update(updates).eq("email", email);
          } else if (customerId) {
            // last resort: ensure a row exists keyed by Stripe customer id
            await supabaseAdmin
              .from("users")
              .upsert(
                { stripe_customer_id: customerId, email, phone },
                { onConflict: "stripe_customer_id" }
              );
          }
        } catch (e) {
          console.error("users update/upsert error:", e);
        }

        break;
      }

      // You can add more cases here later if you need them:
      // case "invoice.payment_succeeded": { ... } break;

      default:
        // Log and ignore unhandled event types for now
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

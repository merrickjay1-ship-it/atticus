"use client";

export default function Page() {
  async function handleCheckout(priceId: string) {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url; // redirect to Stripe Checkout
      } else {
        alert(data?.error ?? "Something went wrong");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Failed to connect to checkout");
    }
  }

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-4xl leading-[1.2] tracking-tight">
        Atticus — Calm, Lux Financial Nudges
      </h1>
      <p className="text-neutral-600">
        You’ve got your Next.js app running. Step 1 complete!
      </p>

      <div className="space-x-3">
        <button
          onClick={() =>
            handleCheckout(process.env.NEXT_PUBLIC_PRICE_ID_FOUNDERS!)
          }
          className="rounded-xl px-4 py-2 border"
        >
          Subscribe — Founders $19/mo
        </button>

        <button
          onClick={() =>
            handleCheckout(process.env.NEXT_PUBLIC_PRICE_ID_PLUS!)
          }
          className="rounded-xl px-4 py-2 border"
        >
          Plus $39/mo
        </button>

        <button
          onClick={() =>
            handleCheckout(process.env.NEXT_PUBLIC_PRICE_ID_PRO!)
          }
          className="rounded-xl px-4 py-2 border"
        >
          Pro $99/mo
        </button>
      </div>
    </main>
  );
}

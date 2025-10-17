// src/app/api/plaid/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    console.log('PLAID WEBHOOK:', body);
    // Later: verify signature and fan out to jobs.
    return NextResponse.json({ received: true }, { status: 200 });
  } catch {
    return NextResponse.json({ received: false }, { status: 200 });
  }
}

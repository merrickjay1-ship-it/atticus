import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Don’t crash the build: only error at request time if envs are missing
  if (!url || !serviceKey) {
    return NextResponse.json(
      { ok: false, error: "Missing Supabase envs" },
      { status: 500 }
    );
  }

  // Create client at request time (not module scope)
  const supabase = createClient(url, serviceKey);

  // Tiny query just to prove connectivity
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .limit(1);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    sample_user_id: data?.[0]?.id ?? null,
  });
}

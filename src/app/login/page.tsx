"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Goal = {
  id: string;
  title: string;
  target_amount: number | null;
  created_at: string;
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [msg, setMsg] = useState("Loading...");

  useEffect(() => {
    (async () => {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();

      if (userErr || !user) {
        setMsg("Not logged in. Go back to /login");
        return;
      }

      const { data, error } = await supabase
        .from("goals")
        .select("id, title, target_amount, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        setMsg(error.message);
        return;
      }

      setGoals(data ?? []);
      setMsg("");
    })();
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: "60px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Goals</h1>

      {msg ? <p style={{ marginTop: 16 }}>{msg}</p> : null}

      <ul style={{ marginTop: 16 }}>
        {goals.map((g) => (
          <li key={g.id} style={{ padding: 12, border: "1px solid #333", borderRadius: 8, marginBottom: 10 }}>
            <div style={{ fontWeight: 600 }}>{g.title}</div>
            <div style={{ opacity: 0.8 }}>Target: {g.target_amount ?? "—"}</div>
            <div style={{ opacity: 0.6, fontSize: 12 }}>{new Date(g.created_at).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

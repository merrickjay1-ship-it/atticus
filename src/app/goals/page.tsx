"use client";

import { useEffect, useState } from "react";

type Goal = {
  id: string;
  title: string;
  target_amount: number;
  created_at: string;
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      setError("");
      const res = await fetch("/api/goals", { credentials: "include" });
      const json = await res.json();

      if (!res.ok) {
        setError(json?.error || "Unauthorized");
        return;
      }

      setGoals(json.goals || []);
    })();
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: "60px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Goals</h1>

      {error ? (
        <div style={{ marginTop: 16 }}>
          <p>{error}</p>
          <a href="/login">Go to login</a>
        </div>
      ) : null}

      <ul style={{ marginTop: 16 }}>
        {goals.map((g) => (
          <li key={g.id} style={{ padding: 12, border: "1px solid #333", marginBottom: 10 }}>
            <div style={{ fontWeight: 700 }}>{g.title}</div>
            <div>Target: {g.target_amount}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState("");

  async function sendCode() {
    setMsg("");
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) return setMsg(error.message);
    setSent(true);
    setMsg("Code sent.");
  }

  async function verifyCode() {
    setMsg("");
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: "sms",
    });
    if (error) return setMsg(error.message);
    window.location.href = "/goals";
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Log in</h1>

      <label style={{ display: "block", marginTop: 16 }}>Phone</label>
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+18015551234"
        style={{ width: "100%", padding: 10, marginTop: 8 }}
      />

      {!sent ? (
        <button onClick={sendCode} style={{ marginTop: 16, padding: 10, width: "100%" }}>
          Send code
        </button>
      ) : (
        <>
          <label style={{ display: "block", marginTop: 16 }}>Code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            style={{ width: "100%", padding: 10, marginTop: 8 }}
          />
          <button onClick={verifyCode} style={{ marginTop: 16, padding: 10, width: "100%" }}>
            Verify + continue
          </button>
        </>
      )}

      {msg ? <p style={{ marginTop: 16 }}>{msg}</p> : null}
    </div>
  );
}

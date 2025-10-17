// src/app/plaid/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import Script from 'next/script';

type LinkHandler = { open: () => void };
type PlaidCreateOptions = {
  token: string;
  onSuccess: (public_token: string) => void;
  onExit?: () => void;
};
declare global {
  interface Window {
    Plaid?: { create: (opts: PlaidCreateOptions) => LinkHandler };
  }
}

export default function PlaidTestPage() {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');

  const fetchLinkToken = useCallback(async () => {
    const r = await fetch('/api/plaid/create-link-token', { cache: 'no-store' });
    const j = await r.json();
    setToken(j.link_token);
  }, []);

  useEffect(() => {
    // Warm a link token before the click
    fetchLinkToken();
  }, [fetchLinkToken]);

  const openLink = useCallback(async () => {
    if (!ready || !token || !window.Plaid) return;
    const handler = window.Plaid.create({
      token,
      onSuccess: async (public_token) => {
        // Exchange on server; store access_token securely there
        const res = await fetch('/api/plaid/exchange', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ public_token }),
        });
        const j = await res.json();
        if (j.ok) {
          setResult(`Linked ✅ item_id=${j.item_id}`);
        } else {
          setResult(`Exchange failed ❌`);
        }
      },
      onExit: () => {},
    });
    handler.open();
  }, [ready, token]);

  return (
    <>
      <Script
        src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
      <main style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h1>Connect a bank (Plaid sandbox)</h1>
          <button onClick={openLink} style={{ padding: '10px 16px', borderRadius: 8 }}>
            Connect a bank
          </button>
          {result && <p style={{ marginTop: 12 }}>{result}</p>}
          <p style={{ marginTop: 8, color: '#666' }}>
            After linking, try <code>/api/plaid/accounts</code> and <code>/api/plaid/transactions</code>.
          </p>
        </div>
      </main>
    </>
  );
}

'use client';

import { useState, useCallback } from 'react';
import Script from 'next/script';

// --- add this block ---
type PlaidCreateOpts = {
  token: string;
  onSuccess: (public_token: string, metadata: unknown) => void;
  onExit: () => void;
};
type PlaidHandler = { open: () => void };

declare global {
  interface Window {
    Plaid?: { create: (opts: PlaidCreateOpts) => PlaidHandler };
  }
}
// --- end add ---

export default function PlaidTestPage() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const fetchLinkToken = useCallback(async () => {
    const res = await fetch('/api/plaid/create-link-token', { cache: 'no-store' });
    const json = await res.json();
    setLinkToken(json.link_token);
  }, []);

  const openPlaid = useCallback(() => {
    if (!isReady || !linkToken || !window.Plaid) return;
    const handler = window.Plaid.create({
      token: linkToken,
      onSuccess: (public_token) => {
        console.log('Plaid public_token:', public_token);
        alert('Connected! public_token in console.');
      },
      onExit: () => {},
    });
    handler.open();
  }, [isReady, linkToken]);

  const handleClick = useCallback(async () => {
    if (!linkToken) await fetchLinkToken();
    openPlaid();
  }, [linkToken, fetchLinkToken, openPlaid]);

  return (
    <>
      <Script
        src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"
        strategy="afterInteractive"
        onLoad={() => setIsReady(true)}
      />
      <main style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <button
          onClick={handleClick}
          style={{
            padding: '12px 18px',
            borderRadius: 8,
            border: '1px solid #444',
            background: '#111',
            color: '#fff',
          }}
        >
          Connect a bank (Plaid sandbox)
        </button>
      </main>
    </>
  );
}

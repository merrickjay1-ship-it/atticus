'use client';

import { useState, useCallback } from 'react';
import Script from 'next/script';

export default function PlaidTestPage() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [plaidReady, setPlaidReady] = useState(false);

  async function fetchLinkToken() {
    const res = await fetch('/api/plaid/create-link-token', { cache: 'no-store' });
    const json = await res.json();
    setLinkToken(json.link_token);
  }

  const openPlaid = useCallback(() => {
    if (!plaidReady || !linkToken || !(window as any).Plaid) return;
    const handler = (window as any).Plaid.create({
      token: linkToken,
      onSuccess: (public_token: string, metadata: unknown) => {
        // For now, just show it. Next step we'll POST to /api/plaid/exchange.
        console.log('Plaid public_token:', public_token, metadata);
        alert('Connected! public_token in console.');
      },
      onExit: () => {
        // no-op
      },
    });
    handler.open();
  }, [plaidReady, linkToken]);

  async function handleClick() {
    if (!linkToken) await fetchLinkToken();
    openPlaid();
  }

  return (
    <>
      <Script
        src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"
        strategy="afterInteractive"
        onLoad={() => setPlaidReady(true)}
      />
      <main style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h1>Connect a bank (Plaid Link test)</h1>
          <button
            onClick={handleClick}
            style={{
              padding: '10px 16px',
              fontSize: 16,
              borderRadius: 8,
              border: '1px solid #ccc',
              cursor: 'pointer',
            }}
          >
            Launch Plaid Link
          </button>
          <p style={{ marginTop: 12, color: '#666' }}>
            This is a temporary test page. It uses <code>/api/plaid/create-link-token</code>.
          </p>
        </div>
      </main>
    </>
  );
}

'use client';

import { useState, useCallback } from 'react';
import Script from 'next/script';

export default function PlaidTestPage() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [plaidReady, setPlaidReady] = useState(false);
  const [busy, setBusy] = useState(false);

  async function fetchLinkToken() {
    const res = await fetch('/api/plaid/create-link-token', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to create link token');
    const json = await res.json();
    setLinkToken(json.link_token);
  }

  const openPlaid = useCallback(() => {
    if (!plaidReady || !linkToken || !(window as any).Plaid) return;

    const handler = (window as any).Plaid.create({
      token: linkToken,
      onSuccess: async (public_token: string, metadata: unknown) => {
        console.log('Plaid public_token:', public_token, metadata);
        setBusy(true);
        try {
          // NEW: exchange public_token on our server
          const res = await fetch('/api/plaid/exchange', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ public_token }),
          });
          const json = await res.json();
          console.log('Exchange result:', json);
          if (json.ok) {
            alert('Success! Token exchanged. Check console for details.');
          } else {
            alert('Exchange failed. See console for error.');
          }
        } catch (e: any) {
          console.error('Exchange error:', e);
          alert('Exchange threw an error (see console).');
        } finally {
          setBusy(false);
        }
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
            disabled={busy}
            style={{
              padding: '10px 16px',
              fontSize: 16,
              borderRadius: 8,
              border: '1px solid #ccc',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? 'Working…' : 'Launch Plaid Link'}
          </button>
          <p style={{ marginTop: 12, color: '#666' }}>
            Uses <code>/api/plaid/create-link-token</code> and then POSTs to{' '}
            <code>/api/plaid/exchange</code>.
          </p>
        </div>
      </main>
    </>
  );
}

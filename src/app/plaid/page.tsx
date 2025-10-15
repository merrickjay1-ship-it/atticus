'use client';

import { useState, useCallback } from 'react';
import Script from 'next/script';

export default function PlaidTestPage() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // fetch link token from our API route
  const fetchLinkToken = useCallback(async () => {
    const res = await fetch('/api/plaid/create-link-token', { cache: 'no-store' });
    const json = await res.json();
    setLinkToken(json.link_token);
  }, []);

  const openPlaid = useCallback(() => {
    if (!isReady || !linkToken || !(window as any).Plaid) return;
    const handler = (window as any).Plaid.create({
      token: linkToken,
      onSuccess: (public_token: string, metadata: unknown) => {
        // next step later: POST public_token to /api/plaid/exchange
        console.log('Plaid public_token:', public_token, metadata);
        alert(`Connected! public_token in console.`);
      },
      onExit: () => {
        // noop
      },
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
          style={{ padding: '12px 20px', borderRadius: 8, border: '1px solid #ccc' }}
        >
          Connect a bank (Sandbox)
        </button>
      </main>
    </>
  );
}

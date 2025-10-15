## 2025-10-12
- Change: Deleted stray `/app/page.tsx` at repo root.
- Reason: Next.js build error “page.tsx doesn't have a root layout”; real app lives in `/src/app`.
- Affects: Web (Next.js on Vercel).
- Expected: Build succeeds; `/` serves from `src/app/page.tsx`.
- Rollback: Recreate file (NOT recommended).
### 2025-10-12 — Database: add core fintech tables
- Added tables: `plaid_items`, `plaid_accounts`, `transactions`, `goals`, `nudges`, `subscriptions`.
- No app code changes; created via Supabase SQL Editor.
2025-10-12 — DB: enable RLS + owner-only SELECT for subscriptions.
2025-10-14 — Fix Plaid test page path
- Move Plaid test page from src/app/api/plaid/page.tsx to src/app/plaid/page.tsx.
- Reason: files under app/api are API routes, not pages; /plaid was 404.
- Affects: /plaid now renders client page and calls /api/plaid/create-link-token.


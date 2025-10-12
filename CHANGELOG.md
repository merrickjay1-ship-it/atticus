## 2025-10-12
- Change: Deleted stray `/app/page.tsx` at repo root.
- Reason: Next.js build error “page.tsx doesn't have a root layout”; real app lives in `/src/app`.
- Affects: Web (Next.js on Vercel).
- Expected: Build succeeds; `/` serves from `src/app/page.tsx`.
- Rollback: Recreate file (NOT recommended).


# FlipKit Pro

A toolkit for eBay resellers: draft listings, price them honestly, track
profit, and keep reusable templates — all in the browser, no account, no
server required for the tools themselves.

## The tools

- **Listing Generator** — turns a product name, your own notes, and a
  condition into an 80-character title (deduped, filler words stripped,
  never cut mid-word), honest item specifics, description bullets built
  from *your* notes, and category-path suggestions. It deliberately does
  **not** suggest a price: FlipKit has no live market data, so pricing is
  your call (see the Pricing Calculator). Feature claims like "Tested &
  Working" are only added when your notes actually say so.
- **Enhance with AI (optional, bring your own key)** — paste your own free
  Google Gemini API key under **AI Settings** in the sidebar and the
  Listing Generator can polish a draft with AI. The key lives only in
  your browser's local storage and is sent only to Google. Without a key
  — or if the call fails — the deterministic draft is used untouched.
  Always review AI output before posting.
- **Bulk Optimizer** — batch-cleanup of listing titles (uppercase mode,
  filler removal, word-boundary truncation at 80 chars).
- **Pricing Calculator** — recommended price from buy price, shipping,
  marketplace/payment fees, and your target margin. The math lives in
  `src/lib/pricing.ts` and is unit-tested.
- **Keyword Research** — builds a starter keyword list from a product
  type, grouped as Core / Supporting / Long-tail phrases. These are
  structural suggestions, **not** search-volume rankings — refine them
  against eBay sold listings.
- **Profit Tracker** — log sales (data stays in your browser), automatic
  fee math (eBay 12.9% + $0.30 model), totals, a per-category chart, and
  CSV export.
- **Templates Library** — reusable listing templates stored in your
  browser.
- **Condition Helper** — generates clear, honest condition descriptions
  from a condition grade plus the issues you list.

Keyboard shortcuts: press `g` then a letter (d dashboard, l listing
generator, p pricing, k keywords, t templates, b bulk, c condition,
f profit tracker). `?` shows the shortcut list. Light/dark theme toggle
in the sidebar.

## Running it

```bash
pnpm install --frozen-lockfile
pnpm run dev        # FlipKit Pro dev server (http://localhost:5173)
pnpm run build      # typecheck + production build (all packages)
pnpm run build:web  # typecheck + production build (FlipKit Pro web app only)
pnpm run preview    # preview production bundle locally
pnpm run test       # unit tests (vitest)
```

The app builds and runs outside Replit with zero environment variables required — `PORT` and `BASE_PATH` fall back to `5173` and `/` when unset, and Replit dev plugins only load inside Replit (`REPL_ID` set in dev).

## Deploying

FlipKit Pro is deployment-ready for **Vercel** (`vercel.json`), **Netlify** (`netlify.toml`), and **Docker** (`Dockerfile` + nginx). See [**DEPLOYMENT.md**](./DEPLOYMENT.md) for step-by-step deploy commands, security headers, environment variable notes, and honest readiness status.

## Honest status / known gaps

- **All data is local.** Sales, templates, stats, and your Gemini key
  live in browser localStorage. Nothing syncs between devices, and
  clearing browser storage erases them.
- **The API server (`artifacts/api-server`) currently exposes only
  `GET /api/healthz`.** The web app does not call it — every tool runs
  fully client-side. The database package (`lib/db`) is unused template
  scaffolding.
- **`artifacts/mockup-sandbox` is leftover Replit scaffolding** — a
  duplicate of the UI kit, not part of the product. Safe to delete; left
  in place pending a decision.
- No eBay integration yet: FlipKit drafts listings, it does not post
  them. Export is copy/paste or CSV.

## Layout

- `artifacts/flipkit-pro` — the web app (React + Vite + Tailwind)
- `artifacts/api-server` — Express server (health check only, for now)
- `lib/` — shared workspace packages (API client/spec scaffolding, db template)
- Core logic worth reading: `artifacts/flipkit-pro/src/lib/` —
  `generators.ts` (deterministic listing/keyword/condition generation),
  `pricing.ts` (fee & margin math), `csvExport.ts`, `aiEnhance.ts`
  (BYOK Gemini enhancement), each with unit tests beside it.

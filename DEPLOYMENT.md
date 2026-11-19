# Deploying FlipKit Pro

FlipKit Pro (`artifacts/flipkit-pro`) is a **100% client-side React + Vite + Tailwind CSS SPA**. It requires **no backend server, no database, and no server-side API keys** to build or deploy.

---

## Architecture & Stack Summary

| Component | Path | Deployment Role |
|---|---|---|
| **FlipKit Pro (Web App)** | `artifacts/flipkit-pro` | **Primary product.** Static React 19 + Vite 7 + Tailwind 4 bundle emitted to `artifacts/flipkit-pro/dist/public`. All reseller tools run deterministically in the browser using `localStorage`. |
| **API Server (Optional)** | `artifacts/api-server` | **Optional / health-check only.** Express 5 server exposing `GET /health`, `GET /api/health`, and `GET /api/healthz`. The FlipKit Pro frontend does **not** call it; deploy only if you later extend it. |
| **Database Package** | `lib/db` | Unused PostgreSQL + Drizzle ORM template scaffolding (`lib/db/src/schema/index.ts` is empty). Not required for FlipKit Pro. |
| **Mockup Sandbox** | `artifacts/mockup-sandbox` | Leftover Replit UI-kit preview workspace. Not part of the production app. |

- **Node.js:** `>=20.19.0` (recommended: **Node 22 LTS**, pinned in `.nvmrc`)
- **Package Manager:** **pnpm 10** (`packageManager: "pnpm@10.33.0"` in root `package.json`, auto-managed by Corepack)
- **Replit Decoupling:** Replit Vite plugins (`@replit/vite-plugin-runtime-error-modal`, `cartographer`, `dev-banner`) are strictly opt-in when `NODE_ENV !== "production"` **and** `REPL_ID` is set. Standard builds on Vercel, Netlify, Docker, GitHub Actions, and local machines never load them.

---

## Prerequisites

```bash
node -v          # >= 20.19.0 (Node 22 LTS recommended)
corepack enable  # activates pnpm@10.33.0 from package.json
pnpm -v
```

---

## Environment Variables

Copy `.env.example` only if you want to customize local ports or later run the optional API server. **Zero environment variables are required to deploy FlipKit Pro.**

| Variable | Scope | Required | Default | Description |
|---|---|---|---|---|
| `PORT` | Web dev/preview (`vite`) | No | `5173` | Port for `pnpm dev` / `pnpm preview`. Validated strictly if set. |
| `BASE_PATH` | Web build (`vite`) | No | `/` | Public base path if hosting under a subpath (e.g. `/flipkit/`). |
| `PORT` | Docker (`nginx`) | No | `8080` | Container listen port (injected automatically on Render / Cloud Run / Fly). |
| `PORT` | Optional `api-server` | No | `3001` | Port for standalone `artifacts/api-server`. |
| `HOST` | Optional `api-server` | No | `0.0.0.0` | Bind address for standalone `artifacts/api-server`. |
| `NODE_ENV` | Optional `api-server` | No | `development` | Set `production` for JSON structured logs without `pino-pretty`. |
| `LOG_LEVEL` | Optional `api-server` | No | `info` | Pino log level (`fatal`, `error`, `warn`, `info`, `debug`, `trace`). |
| `DATABASE_URL` | Unused `lib/db` | No | — | PostgreSQL connection URL. Only needed if you later add Drizzle tables and import `@workspace/db`. |

### BYOK AI ("Enhance with AI") — No Server Secret Required

FlipKit Pro ships with **no server-side Gemini key** and **never silently falls back to a house key**.

- To use **Enhance with AI** in the Listing Generator, each user optionally creates a free Google Gemini API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and pastes it into **AI Settings** (bottom of the sidebar).
- The key is stored only in that browser's `localStorage` (`flipkit-gemini-key`) and sent directly to Google's Gemini endpoint via the `x-goog-api-key` header (never in the URL, never proxied through a FlipKit server).
- If no key is set or Google returns an error, FlipKit throws an explicit coded `AiError` (`NO_KEY`, `BAD_KEY`, `HTTP`, `NETWORK`, or `BAD_RESPONSE`) and leaves the deterministic listing draft untouched.

---

## Local Verification

Run these commands from the repository root with **no Replit environment variables set**:

```bash
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run test
pnpm run build

# Serve the production bundle locally and smoke-test it
pnpm run preview
# In another terminal:
curl -fsS -I http://127.0.0.1:5173/
```

Expected results:
- `pnpm run typecheck` exits `0` across all workspace libraries and apps.
- `pnpm run test` runs Vitest and passes all **34 unit tests** (`generators`, `pricing`, `csvExport`, `aiEnhance`).
- `pnpm run build` outputs the production SPA to `artifacts/flipkit-pro/dist/public/`.

---

## Deploy Targets

### 1. Vercel (Recommended — Fastest Free/Low-Cost Static Deploy)

`vercel.json` is preconfigured at the repository root with:
- Monorepo install & build commands (`pnpm install --frozen-lockfile`, `pnpm run build:web`)
- Output directory: `artifacts/flipkit-pro/dist/public`
- SPA client-side routing rewrite (`wouter` routes like `/pricing`, `/keywords`, `/tracker` resolve cleanly on refresh)
- Security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`) + immutable asset caching

**Option A — Vercel Dashboard (Zero-Config Git Import):**
1. Go to [vercel.com/new](https://vercel.com/new) and import `VpkDevs/listing-engine`.
2. Leave **Root Directory** as `.` (repository root) — Vercel reads `vercel.json` automatically.
3. No environment variables are required. Click **Deploy**.

**Option B — Vercel CLI:**
```bash
npx vercel login
npx vercel --prod
```

---

### 2. Netlify

`netlify.toml` is preconfigured at the repository root with Node 22, `pnpm run build:web`, publish directory `artifacts/flipkit-pro/dist/public`, SPA `/* -> /index.html 200` redirect, and matching security headers.

**Option A — Netlify Dashboard:**
1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**.
2. Select `VpkDevs/listing-engine`. Netlify auto-detects `netlify.toml`.
3. No environment variables are required. Click **Deploy site**.

**Option B — Netlify CLI:**
```bash
npx netlify login
npx netlify deploy --build --prod
```

---

### 3. Docker (Self-Hosted / Render / Fly.io / Railway / Cloud Run)

The root `Dockerfile` is a multi-stage build:
- **Stage 1 (`builder`):** `node:22-slim` + Corepack `pnpm@10.33.0`, runs `pnpm install --frozen-lockfile` and `pnpm run build:web`.
- **Stage 2 (`runner`):** `nginx:1.27-alpine` serving the static bundle with gzip, security headers, SPA fallback, dynamic `${PORT}` binding (default `8080`), and a built-in `GET /health` endpoint (`{"status":"ok","service":"flipkit-pro"}`) wired to Docker `HEALTHCHECK`.

```bash
# Build production image
docker build -t flipkit-pro:latest .

# Run locally on port 8080
docker run --rm -p 8080:8080 flipkit-pro:latest

# Verify health and HTML
curl -fsS http://127.0.0.1:8080/health
curl -fsS -I http://127.0.0.1:8080/
```

To deploy under a subpath (e.g. `/flipkit/`):
```bash
docker build --build-arg BASE_PATH=/flipkit/ -t flipkit-pro:subpath .
```

---

### 4. Optional `artifacts/api-server` (Only If Extended Later)

FlipKit Pro does **not** need `artifacts/api-server` deployed today — it currently exposes only `GET /health`, `GET /api/health`, and `GET /api/healthz`. If you build backend endpoints on top of it later:

```bash
pnpm run build:api
PORT=3001 HOST=0.0.0.0 NODE_ENV=production pnpm run start:api
curl -fsS http://127.0.0.1:3001/api/healthz
```

---

## Honest Readiness & Remaining Owner Steps

What is **ready right now**:
- Replit lock-in removed (cross-platform `pnpm-workspace.yaml`, strictly opt-in Replit Vite plugins, pinned `pnpm@10.33.0` and Node `>=20.19.0`).
- Clean `typecheck`, **34/34 passing Vitest tests**, and production Vite build verified with zero Replit env vars.
- Production deployment configs (`vercel.json`, `netlify.toml`, `Dockerfile`, `.dockerignore`, `docker/nginx.conf.template`, `.env.example`, `.github/workflows/ci.yml`) committed and verified.

Remaining **external owner steps** (cannot be done inside the git repo):
1. **Connect a hosting account:** Import `VpkDevs/listing-engine` in Vercel or Netlify (or push the Docker image to your container host) and trigger the first production deploy.
2. **Optional custom domain:** Attach your custom domain and DNS records in Vercel/Netlify once live.
3. **Optional personal AI key:** Open the live app → **AI Settings** → paste your own Google Gemini API key if you want to use "Enhance with AI" (each user brings their own key).
4. **Future product scope (not built yet):** FlipKit Pro currently stores all data locally in browser `localStorage` and exports via copy/paste or CSV. Cloud sync, user accounts, database persistence (`lib/db`), and direct eBay OAuth posting are **not implemented** — no backend or database needs to be provisioned until you build those features.

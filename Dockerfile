# syntax=docker/dockerfile:1

# =============================================================================
# Stage 1: Build FlipKit Pro static SPA (React + Vite + Tailwind)
# =============================================================================
FROM node:22-slim AS builder

WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    CI=true

RUN corepack enable

# Copy workspace manifests first for deterministic layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json tsconfig.json ./
COPY artifacts/flipkit-pro/package.json ./artifacts/flipkit-pro/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/mockup-sandbox/package.json ./artifacts/mockup-sandbox/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/db/package.json ./lib/db/
COPY scripts/package.json ./scripts/

RUN pnpm install --frozen-lockfile

# Copy workspace source and run typecheck + production Vite build
COPY artifacts/ ./artifacts/
COPY lib/ ./lib/
COPY scripts/ ./scripts/

ARG BASE_PATH=/
ENV BASE_PATH=${BASE_PATH}

RUN pnpm run build:web

# =============================================================================
# Stage 2: Minimal production static server (nginx + security headers + /health)
# =============================================================================
FROM nginx:1.27-alpine AS runner

ENV PORT=8080 \
    NGINX_ENVSUBST_FILTER=^PORT$

COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/artifacts/flipkit-pro/dist/public /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/health" || exit 1

CMD ["nginx", "-g", "daemon off;"]

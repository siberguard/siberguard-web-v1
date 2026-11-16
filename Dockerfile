# syntax=docker/dockerfile:1.7
# Image produksi SOC Merdeka (Next.js standalone + Payload).
# Build tidak membutuhkan database: halaman dirender saat request pertama lalu di-cache.

FROM node:24.22.3-alpine AS base
RUN apk add --no-cache libc6-compat
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@10.34.9 --activate
WORKDIR /app

# --- Dependensi ---
FROM base AS deps
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# --- Build ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* dan TURNSTILE_SITE_KEY dibaca saat build (CSP & URL publik).
ARG NEXT_PUBLIC_SERVER_URL
ARG TURNSTILE_SITE_KEY=""
ENV NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL} \
    TURNSTILE_SITE_KEY=${TURNSTILE_SITE_KEY} \
    SKIP_BUILD_PRERENDER=1 \
    NODE_ENV=production \
    PAYLOAD_SECRET=build-only-placeholder \
    DATABASE_URL=mongodb://build-placeholder:27017/build
RUN pnpm build

# --- Alat (seed, migrasi, skrip) — dipakai lewat: docker compose run --rm tools pnpm seed ---
FROM builder AS tools
ENV SKIP_BUILD_PRERENDER=0
CMD ["pnpm", "seed"]

# --- Runtime ---
FROM node:24.22.3-alpine AS runner
RUN apk add --no-cache libc6-compat wget
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    MEDIA_DIR=/app/media
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs \
    && mkdir -p /app/media /app/.next && chown -R nextjs:nodejs /app/media /app/.next
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "server.js"]

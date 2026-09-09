# syntax=docker/dockerfile:1

# --- deps: install dependencies (cached separately from source changes) ---
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: the postinstall (`prisma generate`) needs prisma/schema.prisma,
# which isn't copied into this stage. Generation happens explicitly in the
# builder stage below, once the full source is present.
RUN npm ci --ignore-scripts

# --- builder: generate Prisma client and build the Next.js app ---
FROM node:20-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build-time placeholders only — lib/auth.ts requires these env vars to be
# present at module load, but the actual runtime values must come from the
# container's real environment (see README / docker run -e flags below).
ENV DATABASE_URL="file:./build.db"
ENV JWT_ACCESS_SECRET="build-time-placeholder"
ENV JWT_REFRESH_SECRET="build-time-placeholder"
RUN npx prisma generate
RUN npm run build

# --- runner: minimal production image ---
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

# Next.js standalone output (trimmed server bundle) as the base, then the
# full node_modules on top. The Prisma CLI's dependency tree (needed at
# startup to run `prisma db push` against the mounted volume) is too deep to
# cherry-pick reliably package-by-package, so we take the straightforward,
# correct-by-construction route here rather than a fragile selective copy.
# (No /public directory in this project — add a COPY line here if one is added later.)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh && chown nextjs:nodejs docker-entrypoint.sh

# Pre-create the data directory with the right ownership: when a named
# volume is mounted here for the first time, Docker seeds it from the
# image's existing content/permissions, so the non-root nextjs user (below)
# can actually write the SQLite file into it.
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]

# =========================================================================
# AI Router — production container
# Bundles: pnpm monorepo + git (for HF push) + python build deps
# =========================================================================
FROM node:20-bookworm-slim AS base

# git is required at runtime by the deploy module (git push to HF Space).
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
    python3 \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# ---------- install ----------
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY artifacts/api-server/package.json artifacts/api-server/
COPY artifacts/ai-router/package.json  artifacts/ai-router/
COPY artifacts/mockup-sandbox/package.json artifacts/mockup-sandbox/
COPY lib/api-client-react/package.json lib/api-client-react/
COPY lib/api-spec/package.json         lib/api-spec/
COPY lib/api-zod/package.json          lib/api-zod/
COPY lib/db/package.json               lib/db/
COPY lib/replit-auth-web/package.json  lib/replit-auth-web/
COPY scripts/package.json              scripts/
RUN pnpm install --frozen-lockfile

# ---------- build ----------
FROM deps AS build
COPY . .
ENV PORT=8080 BASE_PATH=/
RUN pnpm -r --if-present --filter @workspace/api-server --filter "@workspace/api-server^..." run build \
    && pnpm --filter @workspace/ai-router run build

# ---------- runtime ----------
FROM base AS runtime
ENV NODE_ENV=production \
    PORT=8080 \
    STATIC_DIR=/app/public
WORKDIR /app

COPY --from=build /app /app
RUN cp -r /app/artifacts/ai-router/dist/public /app/public

RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8080
CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]

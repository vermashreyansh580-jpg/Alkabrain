# ALKABRAIN

A warm, Claude.ai-style AI companion that auto-routes every message to the right open-source HF model. Multi-agent collaboration on code, daily quotas with reset window, Razorpay subscription billing, and self-deploy to Hugging Face Spaces.

## Stack

- **Monorepo**: pnpm workspaces · TypeScript 5.9
- **Frontend**: React + Vite (`artifacts/ai-router`)
- **API**: Express 5 (`artifacts/api-server`) — esbuild bundle
- **Database**: PostgreSQL + Drizzle ORM (`lib/db`)
- **API codegen**: Orval from OpenAPI (`lib/api-spec` → `lib/api-client-react`, `lib/api-zod`)
- **Auth**: Replit Auth (OIDC + PKCE), shared web hook in `lib/replit-auth-web`
- **Billing**: Razorpay payment links + webhook (HMAC verified)
- **Models**: Hugging Face Router (OpenAI-compatible) across 22 models

## Tiers

| Tier    | Price       | Daily messages | Multi-agent | Notes                                |
|---------|-------------|---------------|-------------|--------------------------------------|
| Free    | ₹0          | 30            | no          | General routing                      |
| Starter | ₹999/mo     | 500           | yes         | All models, Coder + Reviewer on code |
| Pro     | ₹2499/mo    | 5000          | yes         | Priority routing + R1 deep review    |

Payment links: `https://rzp.io/rzp/vXngZyC4` (Starter), `https://rzp.io/rzp/UudyBfFv` (Pro). Razorpay webhook upgrades the user automatically by matching their email.

## Multi-agent

When the router classifies an intent as `code` and the user has Starter or Pro, the chat endpoint runs:
1. **Coder agent** — DeepSeek V3 (fallback Qwen 2.5 Coder 32B)
2. **Reviewer agent** — DeepSeek R1 Distill Llama 70B

The reply is the coder output plus a structured review section.

## Persona

`artifacts/api-server/src/lib/persona.ts` — warm, friendly, matches the user's language (English, Hindi, Hinglish). Never names internal models unless asked.

## Required env

- `DATABASE_URL` — auto-provisioned Postgres
- `HF_TOKEN` — Hugging Face token (write access for self-deploy)
- `SESSION_SECRET` — session secret for cookies
- `RAZORPAY_WEBHOOK_SECRET` — verifies the Razorpay webhook signature
- `REPL_ID`, `ISSUER_URL` — set by Replit for auth

## Key commands

- `pnpm --filter @workspace/db run push` — apply schema changes
- `pnpm --filter @workspace/api-spec run codegen` — regenerate hooks + zod
- `pnpm --filter @workspace/ai-router run dev` — frontend
- `pnpm --filter @workspace/api-server run dev` — backend

## Razorpay webhook setup

In the Razorpay dashboard, add a webhook:
- URL: `https://<your-replit-domain>/api/webhooks/razorpay`
- Events: `payment.captured`
- Secret: same value as `RAZORPAY_WEBHOOK_SECRET`

The webhook router is mounted **before** `express.json()` so the raw body is preserved for HMAC verification.

## Self-deploy to HF Space

The `Deploy` tab pushes the bundled router to `shrey77777/xyzzz` via the existing deploy job (uses `HF_TOKEN`).

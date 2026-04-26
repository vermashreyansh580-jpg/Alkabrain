---
title: Alkabrain
emoji: 🧠
colorFrom: yellow
colorTo: red
sdk: docker
app_port: 8080
pinned: false
---

# AI Router — Self-Deploying Claude-Style Workspace

A polished AI chat workspace that intelligently routes each prompt to the best of 20+ open-source
Hugging Face models, with a built-in DevOps console that **pushes the app to your own Hugging Face
Space and watches the build live**.

## Features

- **Claude.ai-style split workspace** — chat on the left, an Artifacts viewer on the right
  for code, markdown, and Mermaid diagrams (syntax-highlighted, copy/download).
- **Server-side intent router** — picks a code, math, reasoning, summarization, translation, or
  general model based on the prompt. The pick + reason is shown above every assistant reply.
- **Multi-language replies** — the assistant always answers in the language the user wrote in
  (English, Hindi, Hinglish, etc.).
- **DevOps Module** — one-click push of a bundled FastAPI + Docker template to your Hugging Face
  Space (`shrey77777/xyzzz` by default), with live polling of the Space build stage and a
  deployment history.
- **Zero token leakage** — `HF_TOKEN` is read only from the server-side environment. The frontend
  never sees it; the UI only shows whether it's configured.

## Architecture

```
┌──────────────────────────┐    ┌──────────────────────┐    ┌────────────────────────┐
│ React + Vite frontend    │ ── │ Express backend      │ ── │ HF Inference Router    │
│ (Claude-style UI)        │    │ - intent router      │    │ (chat completions)     │
│ - chat, artifacts        │    │ - HF inference call  │    └────────────────────────┘
│ - deploy console         │    │ - git-push deployer  │ ── │ Hugging Face Space     │
│ - models catalog         │    │ - status poller      │    │ shrey77777/xyzzz       │
└──────────────────────────┘    └──────────────────────┘    └────────────────────────┘
```

The pushed Space contains a self-contained **Python 3.11 + FastAPI + Docker** version of the same
router with the same 20+ model catalog. See `artifacts/api-server/src/hf-space-template/`.

## Required environment variables

| Variable          | Required | Default                   | Notes                                  |
| ----------------- | -------- | ------------------------- | -------------------------------------- |
| `HF_TOKEN`        | yes      | —                         | Hugging Face token with **write** scope |
| `HF_SPACE_REPO`   | no       | `shrey77777/xyzzz`        | `<user>/<space-name>`                  |
| `HF_SPACE_BRANCH` | no       | `main`                    |                                        |
| `HF_USER`         | no       | first part of `HF_SPACE_REPO` | username for the Git push URL      |

> The token is **never** read or rendered on the client. The `/api/deploy/config` endpoint only
> reports `hasToken: true|false`.

### Setting the token on Replit

`HF_TOKEN` is already requested as a Replit Secret — the agent will prompt you. Treat any token
that has ever been pasted into a chat as compromised: revoke it at
<https://huggingface.co/settings/tokens> and issue a fresh one.

### Setting the token on Hugging Face

The pushed Space also needs `HF_TOKEN` so its `/chat` endpoint can call the Inference API. Add it
under **Settings → Variables and secrets** on the Space.

## Running locally

```bash
pnpm install
# in three terminals:
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/ai-router  run dev
```

The frontend talks to the backend through the shared proxy at `/api/...`.

## Running in Docker

A single-container Dockerfile that builds the React frontend, runs the Express backend, and bundles
`git` + Python build deps for the deploy module:

```bash
docker build -t ai-router .
docker run --rm -p 8080:8080 \
  -e HF_TOKEN="hf_xxx" \
  -e HF_SPACE_REPO="your-username/your-space" \
  ai-router
```

## Deploying to your Hugging Face Space

1. Make sure `HF_TOKEN` is set (Replit Secrets or `.env` for Docker).
2. Open the **Deploy** page in the app.
3. Optional: enter a commit message.
4. Click **Deploy to Hugging Face Space**.
5. Watch the live progress — `pending → pushing → building → success/failed`. On success you get
   the commit SHA and a link to the live Space.

The deploy module clones the target Space, replaces the working tree with the bundled template,
commits, and pushes — then polls the HF Spaces API for `runtime.stage` until it's `RUNNING` (or an
error stage).

## Security notes

- All secrets are read from `process.env` on the server. They are never serialized to the client.
- The frontend has no field for the HF token — it cannot be entered in the UI.
- The Docker container drops to a non-root user.
- The pushed Space's Dockerfile also runs as a non-root `appuser`.

## API (selected)

- `GET  /api/models` — list of routable models
- `POST /api/chat`   — `{ messages, modelId? }` → routed reply with model + intent + artifact
- `GET  /api/deploy/config`  — `{ spaceRepo, hasToken, defaultBranch }`
- `POST /api/deploy/push`    — start a deploy, returns the job
- `GET  /api/deploy/status`  — current job + live HF runtime stage
- `GET  /api/deploy/history` — last 20 jobs

## Repo layout

```
artifacts/
  ai-router/                  # React + Vite frontend
  api-server/                 # Express backend
    src/lib/models.ts         # 20+ model catalog
    src/lib/router.ts         # intent classifier + model picker
    src/lib/hf-inference.ts   # Hugging Face Inference call
    src/lib/deploy.ts         # git-push + build poller
    src/routes/{chat,deploy,models}.ts
    src/hf-space-template/    # FastAPI + Docker bundle pushed to HF
lib/
  api-spec/openapi.yaml       # contract source of truth
  api-client-react/           # generated React Query hooks
  api-zod/                    # generated Zod schemas
```

## License

MIT

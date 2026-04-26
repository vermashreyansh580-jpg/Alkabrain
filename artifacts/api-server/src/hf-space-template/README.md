---
title: AI Router
emoji: ⚡
colorFrom: yellow
colorTo: red
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# AI Router — Hugging Face Space

This Space hosts a FastAPI-based AI Router that selects the best of 20+ open-source models on the
Hugging Face Inference API based on the user's intent.

It is automatically pushed and updated by the **Replit AI Router** control plane via Git.

## Endpoints

- `GET /` — landing page
- `GET /health` — liveness probe
- `GET /models` — list of routable models
- `POST /chat` — body: `{ "messages": [{ "role": "user", "content": "..." }], "model_id": "..." (optional) }`

## Configuration

The Space needs an `HF_TOKEN` repository secret (Settings → Variables and secrets) so it can call
the Inference API. Without it, `/chat` returns 503.

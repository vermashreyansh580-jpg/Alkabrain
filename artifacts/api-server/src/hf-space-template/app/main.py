import os
import time
from typing import List, Optional, Literal

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from .models import MODEL_CATALOG
from .router import route_prompt

HF_TOKEN = os.environ.get("HF_TOKEN")

app = FastAPI(title="AI Router", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model_id: Optional[str] = None
    temperature: Optional[float] = None


class ChatResponse(BaseModel):
    reply: str
    model_id: str
    model_label: str
    intent: str
    latency_ms: int
    router_reason: str


SYSTEM_PROMPT = (
    "You are AI Router — a thoughtful, helpful assistant. "
    "Always reply in the same language the user wrote in (English, Hindi, Hinglish, etc.). "
    "Wrap code in fenced blocks with a language tag. "
    "Use ```mermaid for diagrams. Be concise but complete."
)

TRANSLATION_MODELS = {"Helsinki-NLP/opus-mt-en-hi", "Helsinki-NLP/opus-mt-hi-en"}
SUMMARY_MODELS = {"facebook/bart-large-cnn"}


@app.get("/", response_class=HTMLResponse)
def home() -> str:
    return """
    <html><head><title>AI Router</title>
    <style>
      body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;
           max-width:680px;margin:6vh auto;padding:0 1.5rem;color:#222;
           background:#fbf7ef}
      code{background:#efe8d8;padding:2px 6px;border-radius:4px}
      h1{font-weight:600}
      a{color:#b35c1e}
    </style></head><body>
    <h1>AI Router</h1>
    <p>FastAPI service routing chat to the best of 20+ Hugging Face models.</p>
    <ul>
      <li><code>GET /health</code></li>
      <li><code>GET /models</code></li>
      <li><code>POST /chat</code></li>
      <li><a href="/docs">/docs</a> — interactive Swagger UI</li>
    </ul>
    </body></html>
    """


@app.get("/health")
def health():
    return {"status": "ok", "has_token": bool(HF_TOKEN), "model_count": len(MODEL_CATALOG)}


@app.get("/models")
def list_models():
    return {"models": [m.model_dump() for m in MODEL_CATALOG]}


async def _call_chat(model_id: str, messages: list, temperature: Optional[float]) -> str:
    if not HF_TOKEN:
        raise HTTPException(status_code=503, detail="HF_TOKEN not configured")
    payload = {
        "model": model_id,
        "messages": messages,
        "temperature": temperature if temperature is not None else 0.7,
        "max_tokens": 1024,
        "stream": False,
    }
    headers = {"Authorization": f"Bearer {HF_TOKEN}", "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            "https://router.huggingface.co/v1/chat/completions",
            headers=headers, json=payload,
        )
        if r.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"HF error {r.status_code}: {r.text[:300]}")
        data = r.json()
    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as exc:
        raise HTTPException(status_code=502, detail=f"Bad HF response: {exc}")


async def _call_task(model_id: str, payload: dict) -> dict:
    headers = {"Authorization": f"Bearer {HF_TOKEN}", "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            f"https://api-inference.huggingface.co/models/{model_id}",
            headers=headers, json=payload,
        )
        if r.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"HF error {r.status_code}: {r.text[:300]}")
        return r.json()


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    last_user = next((m.content for m in reversed(req.messages) if m.role == "user"), "")
    decision = route_prompt(last_user, req.model_id)

    has_system = any(m.role == "system" for m in req.messages)
    msgs = ([{"role": "system", "content": SYSTEM_PROMPT}] if not has_system else []) + \
           [m.model_dump() for m in req.messages]

    t0 = time.time()
    if decision.model.id in TRANSLATION_MODELS:
        out = await _call_task(decision.model.id, {"inputs": last_user})
        if isinstance(out, list) and out:
            reply = out[0].get("translation_text", "(no translation)")
        else:
            reply = out.get("translation_text", "(no translation)") if isinstance(out, dict) else "(no translation)"
    elif decision.model.id in SUMMARY_MODELS:
        out = await _call_task(decision.model.id, {"inputs": last_user, "parameters": {"max_length": 200, "min_length": 40}})
        if isinstance(out, list) and out:
            reply = out[0].get("summary_text", "(no summary)")
        else:
            reply = out.get("summary_text", "(no summary)") if isinstance(out, dict) else "(no summary)"
    else:
        reply = await _call_chat(decision.model.id, msgs, req.temperature)

    latency_ms = int((time.time() - t0) * 1000)
    return ChatResponse(
        reply=reply,
        model_id=decision.model.id,
        model_label=decision.model.label,
        intent=decision.intent,
        latency_ms=latency_ms,
        router_reason=decision.reason,
    )

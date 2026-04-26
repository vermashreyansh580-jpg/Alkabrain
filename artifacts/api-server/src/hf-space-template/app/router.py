import re
from dataclasses import dataclass
from typing import List, Optional

from .models import MODEL_CATALOG, ModelInfo


@dataclass
class RouteDecision:
    model: ModelInfo
    intent: str
    reason: str


_RULES = [
    ("code", [
        re.compile(r"\b(code|function|bug|debug|stack ?trace|compile|typescript|javascript|python|java|c\+\+|rust|golang|sql|regex|api|endpoint|class|method|algorithm|leetcode|refactor)\b", re.I),
        re.compile(r"```"),
    ], [
        "Qwen/Qwen2.5-Coder-32B-Instruct",
        "deepseek-ai/deepseek-coder-33b-instruct",
        "bigcode/starcoder2-15b-instruct-v0.1",
        "stabilityai/stable-code-instruct-3b",
    ]),
    ("math", [
        re.compile(r"\b(integral|derivative|equation|theorem|prove|matrix|probability|calculus|algebra|geometry|differentiate|integrate)\b", re.I),
        re.compile(r"\d+\s*[\+\-\*\/\^]\s*\d+"),
    ], [
        "Qwen/Qwen2.5-Math-7B-Instruct",
        "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
        "Qwen/Qwen2.5-72B-Instruct",
    ]),
    ("reasoning", [
        re.compile(r"\b(why|explain|reason|step[- ]by[- ]step|analyze|analysis|compare|because|implication|trade-?off|argue)\b", re.I),
    ], [
        "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
        "deepseek-ai/DeepSeek-V3",
        "meta-llama/Llama-3.3-70B-Instruct",
        "Qwen/Qwen2.5-72B-Instruct",
    ]),
    ("summary", [
        re.compile(r"\b(summari[sz]e|tl;?dr|short version|key points|condense)\b", re.I),
    ], [
        "facebook/bart-large-cnn",
        "meta-llama/Llama-3.3-70B-Instruct",
    ]),
    ("translation", [
        re.compile(r"\btranslate\b", re.I),
        re.compile(r"\b(in (hindi|english|spanish|french|german|chinese|japanese))\b", re.I),
    ], [
        "Qwen/Qwen2.5-72B-Instruct",
        "Helsinki-NLP/opus-mt-en-hi",
        "Helsinki-NLP/opus-mt-hi-en",
    ]),
    ("creative", [
        re.compile(r"\b(story|poem|novel|character|fiction|screenplay|lyrics|brainstorm|imagine)\b", re.I),
    ], [
        "NousResearch/Hermes-3-Llama-3.1-70B",
        "meta-llama/Llama-3.3-70B-Instruct",
    ]),
    ("multilingual", [
        re.compile(r"[\u0900-\u097F\u4E00-\u9FFF\u3040-\u30FF\u0600-\u06FF]"),
    ], [
        "Qwen/Qwen2.5-72B-Instruct",
        "Qwen/Qwen2.5-7B-Instruct",
        "mistralai/Mixtral-8x7B-Instruct-v0.1",
    ]),
]


def _find(model_id: str) -> Optional[ModelInfo]:
    return next((m for m in MODEL_CATALOG if m.id == model_id), None)


def route_prompt(prompt: str, override: Optional[str] = None) -> RouteDecision:
    if override:
        m = _find(override)
        if m:
            return RouteDecision(m, m.intents[0] if m.intents else "chat",
                                 "User pinned this model.")

    text = prompt[-2000:]
    matches: List[tuple] = []
    for intent, patterns, preferred in _RULES:
        hits = sum(1 for p in patterns if p.search(text))
        if hits:
            matches.append((hits, intent, preferred))
    matches.sort(key=lambda x: -x[0])

    if not matches:
        is_long = len(text) > 1500
        is_short = len(text) < 80
        fallback_id = ("meta-llama/Llama-3.3-70B-Instruct" if is_long
                       else "mistralai/Mistral-7B-Instruct-v0.3" if is_short
                       else "meta-llama/Llama-3.3-70B-Instruct")
        m = _find(fallback_id) or MODEL_CATALOG[0]
        reason = ("Long prompt → big-context generalist." if is_long
                  else "Short prompt → fast small chat model." if is_short
                  else "General conversation → flagship generalist.")
        return RouteDecision(m, "chat", reason)

    hits, intent, preferred = matches[0]
    for mid in preferred:
        m = _find(mid)
        if m:
            return RouteDecision(m, intent,
                                 f"Detected '{intent}' intent ({hits} signals).")

    return RouteDecision(MODEL_CATALOG[0], "chat", "Default routing.")

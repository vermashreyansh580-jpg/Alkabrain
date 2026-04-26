from typing import List, Optional
from pydantic import BaseModel


class ModelInfo(BaseModel):
    id: str
    label: str
    provider: str
    intents: List[str]
    description: str
    context_window: Optional[int] = None


# Mirror of the catalog in the Replit control plane.
MODEL_CATALOG: List[ModelInfo] = [
    ModelInfo(id="meta-llama/Llama-3.3-70B-Instruct", label="Llama 3.3 70B Instruct", provider="Meta",
              intents=["chat", "reasoning", "general", "long"],
              description="Meta's flagship instruction-tuned 70B model.", context_window=128000),
    ModelInfo(id="meta-llama/Meta-Llama-3.1-8B-Instruct", label="Llama 3.1 8B Instruct", provider="Meta",
              intents=["chat", "general", "fast"],
              description="Lighter Llama variant.", context_window=128000),
    ModelInfo(id="mistralai/Mistral-7B-Instruct-v0.3", label="Mistral 7B Instruct v0.3", provider="Mistral AI",
              intents=["chat", "general", "fast"],
              description="Crisp, low-latency chat model.", context_window=32768),
    ModelInfo(id="mistralai/Mixtral-8x7B-Instruct-v0.1", label="Mixtral 8x7B Instruct", provider="Mistral AI",
              intents=["chat", "reasoning", "general"],
              description="Sparse MoE.", context_window=32768),
    ModelInfo(id="Qwen/Qwen2.5-72B-Instruct", label="Qwen 2.5 72B Instruct", provider="Alibaba",
              intents=["chat", "reasoning", "code", "math", "multilingual"],
              description="Top-tier multilingual model.", context_window=131072),
    ModelInfo(id="Qwen/Qwen2.5-7B-Instruct", label="Qwen 2.5 7B Instruct", provider="Alibaba",
              intents=["chat", "multilingual", "fast"],
              description="Fast multilingual chat model.", context_window=131072),
    ModelInfo(id="Qwen/Qwen2.5-Coder-32B-Instruct", label="Qwen 2.5 Coder 32B", provider="Alibaba",
              intents=["code"], description="Specialised code model.", context_window=131072),
    ModelInfo(id="Qwen/Qwen2.5-Math-7B-Instruct", label="Qwen 2.5 Math 7B", provider="Alibaba",
              intents=["math"], description="Math-focused model.", context_window=4096),
    ModelInfo(id="deepseek-ai/DeepSeek-V3", label="DeepSeek V3", provider="DeepSeek",
              intents=["chat", "reasoning", "code", "general"],
              description="Open-weight frontier model.", context_window=65536),
    ModelInfo(id="deepseek-ai/DeepSeek-R1-Distill-Llama-70B", label="DeepSeek R1 Distill 70B",
              provider="DeepSeek", intents=["reasoning", "math"],
              description="Reasoning-tuned distillation.", context_window=32768),
    ModelInfo(id="deepseek-ai/deepseek-coder-33b-instruct", label="DeepSeek Coder 33B",
              provider="DeepSeek", intents=["code"], description="Strong dedicated coder model.",
              context_window=16384),
    ModelInfo(id="google/gemma-2-27b-it", label="Gemma 2 27B IT", provider="Google",
              intents=["chat", "general"], description="Google's open instruction model.",
              context_window=8192),
    ModelInfo(id="google/gemma-2-9b-it", label="Gemma 2 9B IT", provider="Google",
              intents=["chat", "fast", "general"], description="Compact Gemma.",
              context_window=8192),
    ModelInfo(id="microsoft/Phi-3.5-mini-instruct", label="Phi-3.5 Mini", provider="Microsoft",
              intents=["chat", "fast"], description="Tiny but capable.", context_window=131072),
    ModelInfo(id="HuggingFaceH4/zephyr-7b-beta", label="Zephyr 7B Beta", provider="Hugging Face H4",
              intents=["chat", "general"], description="Friendly conversational tuning.",
              context_window=32768),
    ModelInfo(id="NousResearch/Hermes-3-Llama-3.1-70B", label="Hermes 3 Llama 3.1 70B",
              provider="Nous Research", intents=["chat", "reasoning", "creative"],
              description="Steerable assistant.", context_window=128000),
    ModelInfo(id="tiiuae/falcon-180B-chat", label="Falcon 180B Chat", provider="TII",
              intents=["chat", "long"], description="Large open chat model.",
              context_window=2048),
    ModelInfo(id="facebook/bart-large-cnn", label="BART Large CNN", provider="Meta",
              intents=["summary"], description="Best-in-class summarisation.",
              context_window=1024),
    ModelInfo(id="Helsinki-NLP/opus-mt-en-hi", label="Opus MT EN→HI",
              provider="Helsinki NLP", intents=["translation"],
              description="EN to Hindi MT."),
    ModelInfo(id="Helsinki-NLP/opus-mt-hi-en", label="Opus MT HI→EN",
              provider="Helsinki NLP", intents=["translation"],
              description="Hindi to EN MT."),
    ModelInfo(id="stabilityai/stable-code-instruct-3b", label="Stable Code Instruct 3B",
              provider="Stability AI", intents=["code", "fast"],
              description="Quick code helper.", context_window=16384),
    ModelInfo(id="bigcode/starcoder2-15b-instruct-v0.1", label="StarCoder2 15B Instruct",
              provider="BigCode", intents=["code"], description="Polyglot code model.",
              context_window=16384),
]

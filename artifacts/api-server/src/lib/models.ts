export type ModelEntry = {
  id: string;
  label: string;
  provider: string;
  intents: string[];
  description: string;
  contextWindow?: number;
};

// 20+ open / open-weight models accessible via the Hugging Face Inference API
// (Inference Providers). Intents are used by the router.
export const MODEL_CATALOG: ModelEntry[] = [
  {
    id: "meta-llama/Llama-3.3-70B-Instruct",
    label: "Llama 3.3 70B Instruct",
    provider: "Meta",
    intents: ["chat", "reasoning", "general", "long"],
    description: "Meta's flagship instruction-tuned 70B model. Strong all-rounder for chat and reasoning.",
    contextWindow: 128000,
  },
  {
    id: "meta-llama/Meta-Llama-3.1-8B-Instruct",
    label: "Llama 3.1 8B Instruct",
    provider: "Meta",
    intents: ["chat", "general", "fast"],
    description: "Lighter Llama variant — fast, cheap, decent for casual chat.",
    contextWindow: 128000,
  },
  {
    id: "mistralai/Mixtral-8x7B-Instruct-v0.1",
    label: "Mixtral 8x7B Instruct",
    provider: "Mistral AI",
    intents: ["chat", "reasoning", "general"],
    description: "Sparse MoE that punches above its weight on reasoning and multilingual tasks.",
    contextWindow: 32768,
  },
  {
    id: "Qwen/Qwen2.5-72B-Instruct",
    label: "Qwen 2.5 72B Instruct",
    provider: "Alibaba",
    intents: ["chat", "reasoning", "code", "math", "multilingual"],
    description: "Top-tier multilingual model with strong code and math performance.",
    contextWindow: 131072,
  },
  {
    id: "Qwen/Qwen2.5-7B-Instruct",
    label: "Qwen 2.5 7B Instruct",
    provider: "Alibaba",
    intents: ["chat", "multilingual", "fast"],
    description: "Fast multilingual chat model — handles Hindi/Hinglish, Chinese, etc. well.",
    contextWindow: 131072,
  },
  {
    id: "Qwen/Qwen2.5-Coder-32B-Instruct",
    label: "Qwen 2.5 Coder 32B",
    provider: "Alibaba",
    intents: ["code"],
    description: "Specialised code generation and code editing model.",
    contextWindow: 131072,
  },
  {
    id: "Qwen/Qwen2.5-Math-7B-Instruct",
    label: "Qwen 2.5 Math 7B",
    provider: "Alibaba",
    intents: ["math"],
    description: "Math-focused model, strong at step-by-step arithmetic and word problems.",
    contextWindow: 4096,
  },
  {
    id: "deepseek-ai/DeepSeek-V3",
    label: "DeepSeek V3",
    provider: "DeepSeek",
    intents: ["chat", "reasoning", "code", "general"],
    description: "Open-weight frontier model — strong reasoning and coding.",
    contextWindow: 65536,
  },
  {
    id: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
    label: "DeepSeek R1 Distill 70B",
    provider: "DeepSeek",
    intents: ["reasoning", "math"],
    description: "Reasoning-tuned distillation — best when the user asks 'why' or 'prove'.",
    contextWindow: 32768,
  },
  {
    id: "deepseek-ai/deepseek-coder-33b-instruct",
    label: "DeepSeek Coder 33B",
    provider: "DeepSeek",
    intents: ["code"],
    description: "Strong dedicated coder model.",
    contextWindow: 16384,
  },
  {
    id: "google/gemma-2-27b-it",
    label: "Gemma 2 27B IT",
    provider: "Google",
    intents: ["chat", "general"],
    description: "Google's open instruction model — balanced reasoner.",
    contextWindow: 8192,
  },
  {
    id: "google/gemma-2-9b-it",
    label: "Gemma 2 9B IT",
    provider: "Google",
    intents: ["chat", "fast", "general"],
    description: "Compact Gemma — quick general chat.",
    contextWindow: 8192,
  },
  {
    id: "microsoft/Phi-3.5-mini-instruct",
    label: "Phi-3.5 Mini",
    provider: "Microsoft",
    intents: ["chat", "fast"],
    description: "Tiny but capable model. Snappy for short prompts.",
    contextWindow: 131072,
  },
  {
    id: "HuggingFaceH4/zephyr-7b-beta",
    label: "Zephyr 7B Beta",
    provider: "Hugging Face H4",
    intents: ["chat", "general"],
    description: "Friendly conversational tuning of Mistral 7B.",
    contextWindow: 32768,
  },
  {
    id: "NousResearch/Hermes-3-Llama-3.1-70B",
    label: "Hermes 3 Llama 3.1 70B",
    provider: "Nous Research",
    intents: ["chat", "reasoning", "creative"],
    description: "Steerable assistant with strong creative writing.",
    contextWindow: 128000,
  },
  {
    id: "tiiuae/falcon-180B-chat",
    label: "Falcon 180B Chat",
    provider: "TII",
    intents: ["chat", "long"],
    description: "Large open chat model for verbose long-form answers.",
    contextWindow: 2048,
  },
  {
    id: "facebook/bart-large-cnn",
    label: "BART Large CNN",
    provider: "Meta",
    intents: ["summary"],
    description: "Best-in-class extractive/abstractive summarisation for long text.",
    contextWindow: 1024,
  },
  {
    id: "Helsinki-NLP/opus-mt-en-hi",
    label: "Opus MT EN→HI",
    provider: "Helsinki NLP",
    intents: ["translation"],
    description: "Lightweight English to Hindi machine translation.",
  },
  {
    id: "Helsinki-NLP/opus-mt-hi-en",
    label: "Opus MT HI→EN",
    provider: "Helsinki NLP",
    intents: ["translation"],
    description: "Lightweight Hindi to English machine translation.",
  },
  {
    id: "stabilityai/stable-code-instruct-3b",
    label: "Stable Code Instruct 3B",
    provider: "Stability AI",
    intents: ["code", "fast"],
    description: "Quick, lightweight code helper.",
    contextWindow: 16384,
  },
  {
    id: "bigcode/starcoder2-15b-instruct-v0.1",
    label: "StarCoder2 15B Instruct",
    provider: "BigCode",
    intents: ["code"],
    description: "Polyglot code model trained on permissively licensed code.",
    contextWindow: 16384,
  },
];

export function findModel(id: string): ModelEntry | undefined {
  return MODEL_CATALOG.find((m) => m.id === id);
}

import { MODEL_CATALOG, type ModelEntry } from "./models";

export type RouteDecision = {
  model: ModelEntry;
  intent: string;
  reason: string;
};

type IntentRule = {
  intent: string;
  patterns: RegExp[];
  preferred: string[]; // ordered model ids
};

const RULES: IntentRule[] = [
  {
    intent: "code",
    patterns: [
      /\b(code|function|bug|debug|stack ?trace|compile|typescript|javascript|python|java|c\+\+|rust|golang|sql|regex|api|endpoint|class|method|algorithm|leetcode|refactor)\b/i,
      /```/,
    ],
    preferred: [
      "Qwen/Qwen2.5-Coder-32B-Instruct",
      "deepseek-ai/deepseek-coder-33b-instruct",
      "bigcode/starcoder2-15b-instruct-v0.1",
      "stabilityai/stable-code-instruct-3b",
    ],
  },
  {
    intent: "math",
    patterns: [
      /\b(integral|derivative|equation|theorem|prove|matrix|probability|calculus|algebra|geometry|differentiate|integrate)\b/i,
      /\d+\s*[\+\-\*\/\^]\s*\d+/,
    ],
    preferred: [
      "Qwen/Qwen2.5-Math-7B-Instruct",
      "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
      "Qwen/Qwen2.5-72B-Instruct",
    ],
  },
  {
    intent: "reasoning",
    patterns: [
      /\b(why|explain|reason|step[- ]by[- ]step|analyze|analysis|compare|because|implication|trade-?off|argue)\b/i,
    ],
    preferred: [
      "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
      "deepseek-ai/DeepSeek-V3",
      "meta-llama/Llama-3.3-70B-Instruct",
      "Qwen/Qwen2.5-72B-Instruct",
    ],
  },
  {
    intent: "summary",
    patterns: [
      /\b(summari[sz]e|tl;?dr|short version|key points|condense)\b/i,
    ],
    preferred: [
      "facebook/bart-large-cnn",
      "meta-llama/Llama-3.3-70B-Instruct",
    ],
  },
  {
    intent: "translation",
    patterns: [
      /\btranslate\b/i,
      /\b(in (hindi|english|spanish|french|german|chinese|japanese))\b/i,
    ],
    preferred: [
      "Qwen/Qwen2.5-72B-Instruct",
      "Helsinki-NLP/opus-mt-en-hi",
      "Helsinki-NLP/opus-mt-hi-en",
    ],
  },
  {
    intent: "creative",
    patterns: [
      /\b(story|poem|novel|character|fiction|screenplay|lyrics|brainstorm|imagine)\b/i,
    ],
    preferred: [
      "NousResearch/Hermes-3-Llama-3.1-70B",
      "meta-llama/Llama-3.3-70B-Instruct",
    ],
  },
  {
    intent: "multilingual",
    patterns: [
      // non-ASCII heavy → likely non-English
      /[\u0900-\u097F\u4E00-\u9FFF\u3040-\u30FF\u0600-\u06FF]/,
    ],
    preferred: [
      "Qwen/Qwen2.5-72B-Instruct",
      "Qwen/Qwen2.5-7B-Instruct",
      "mistralai/Mixtral-8x7B-Instruct-v0.1",
    ],
  },
];

export function routePrompt(prompt: string, override?: string): RouteDecision {
  if (override) {
    const m = MODEL_CATALOG.find((x) => x.id === override);
    if (m) {
      return {
        model: m,
        intent: m.intents[0] ?? "chat",
        reason: "User pinned this model explicitly.",
      };
    }
  }

  const text = prompt.slice(-2000); // look at recent context
  const matched: { rule: IntentRule; hits: number }[] = [];
  for (const rule of RULES) {
    let hits = 0;
    for (const p of rule.patterns) if (p.test(text)) hits++;
    if (hits > 0) matched.push({ rule, hits });
  }
  matched.sort((a, b) => b.hits - a.hits);

  // length-based fallback: if very long input → reach for big-context model
  if (matched.length === 0) {
    const isLong = text.length > 1500;
    const isShort = text.length < 80;
    const fallback = isLong
      ? "meta-llama/Llama-3.3-70B-Instruct"
      : isShort
        ? "meta-llama/Meta-Llama-3.1-8B-Instruct"
        : "meta-llama/Llama-3.3-70B-Instruct";
    const m =
      MODEL_CATALOG.find((x) => x.id === fallback) ?? MODEL_CATALOG[0];
    return {
      model: m,
      intent: "chat",
      reason: isLong
        ? "Long prompt → routed to large-context generalist."
        : isShort
          ? "Short casual prompt → routed to fast small chat model."
          : "General conversation → routed to flagship generalist.",
    };
  }

  const top = matched[0];
  for (const id of top.rule.preferred) {
    const m = MODEL_CATALOG.find((x) => x.id === id);
    if (m) {
      return {
        model: m,
        intent: top.rule.intent,
        reason: `Detected '${top.rule.intent}' intent (${top.hits} signal${top.hits > 1 ? "s" : ""}). Selected best ${top.rule.intent} specialist.`,
      };
    }
  }

  // shouldn't happen, but fall through:
  return {
    model: MODEL_CATALOG[0],
    intent: "chat",
    reason: "Default routing.",
  };
}

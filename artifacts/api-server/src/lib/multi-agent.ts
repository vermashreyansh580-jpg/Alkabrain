import { MODEL_CATALOG, type ModelEntry } from "./models";
import { runInference, type HfMessage } from "./hf-inference";

const CODER_ID = "deepseek-ai/DeepSeek-V3";
const CODER_FALLBACK = "Qwen/Qwen2.5-Coder-32B-Instruct";
const REVIEWER_ID = "deepseek-ai/DeepSeek-R1-Distill-Llama-70B";

function pick(id: string, fallback?: string): ModelEntry | null {
  const m = MODEL_CATALOG.find((x) => x.id === id);
  if (m) return m;
  if (fallback) {
    const f = MODEL_CATALOG.find((x) => x.id === fallback);
    if (f) return f;
  }
  return null;
}

export interface AgentStep {
  role: string;
  modelId: string;
  modelLabel: string;
  latencyMs: number;
}

export interface MultiAgentResult {
  reply: string;
  agents: AgentStep[];
  primary: ModelEntry;
}

const CODER_SYSTEM = `You are the Coder agent of ALKABRAIN.
Write clean, idiomatic, production-ready code that solves the user's request.
Always wrap code in fenced code blocks with the right language tag.
Be concise — give the code, then a 2-3 line explanation. Reply in the user's language.`;

const REVIEWER_SYSTEM = `You are the Reviewer agent of ALKABRAIN.
A coder agent has just written code for the user. Your job is to:
1. Spot bugs, edge cases, security issues, or performance problems.
2. Suggest concrete improvements.
3. If the code is solid, say so honestly and add at most one nice-to-have tip.
Keep the review short, friendly, and specific. Reply in the user's language.
Format your reply EXACTLY as:

### 🔍 Code Review
- ...short bullet points...

### ✅ Improved version (if needed)
\`\`\`<language>
... only if you actually have improvements ...
\`\`\``;

export async function runCodingDuo(
  messages: HfMessage[],
  temperature?: number,
): Promise<MultiAgentResult> {
  const coder = pick(CODER_ID, CODER_FALLBACK);
  const reviewer = pick(REVIEWER_ID);
  if (!coder) throw new Error("Coder model not found in catalog");

  const coderMessages: HfMessage[] = [
    { role: "system", content: CODER_SYSTEM },
    ...messages.filter((m) => m.role !== "system"),
  ];
  const t0 = Date.now();
  const coderReply = await runInference(coder, coderMessages, temperature);
  const coderLatency = Date.now() - t0;

  const agents: AgentStep[] = [
    {
      role: "coder",
      modelId: coder.id,
      modelLabel: coder.label,
      latencyMs: coderLatency,
    },
  ];

  if (!reviewer) {
    return {
      reply: coderReply,
      agents,
      primary: coder,
    };
  }

  const userPrompt = [...messages].reverse().find((m) => m.role === "user")
    ?.content ?? "";
  const reviewerMessages: HfMessage[] = [
    { role: "system", content: REVIEWER_SYSTEM },
    {
      role: "user",
      content: `Original request:\n${userPrompt}\n\n--- Coder's answer ---\n${coderReply}\n\nNow review it.`,
    },
  ];
  let reviewReply = "";
  const t1 = Date.now();
  try {
    reviewReply = await runInference(reviewer, reviewerMessages, 0.3);
    agents.push({
      role: "reviewer",
      modelId: reviewer.id,
      modelLabel: reviewer.label,
      latencyMs: Date.now() - t1,
    });
  } catch (err) {
    // Reviewer failed; degrade gracefully — return coder's answer alone
    return { reply: coderReply, agents, primary: coder };
  }

  const combined = `${coderReply}\n\n---\n\n${reviewReply}`;
  return { reply: combined, agents, primary: coder };
}

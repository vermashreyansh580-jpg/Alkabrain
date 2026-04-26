import type { ModelEntry } from "./models";

export type HfMessage = { role: "system" | "user" | "assistant"; content: string };

const HF_TOKEN = process.env["HF_TOKEN"];

const TRANSLATION_MODELS = new Set([
  "Helsinki-NLP/opus-mt-en-hi",
  "Helsinki-NLP/opus-mt-hi-en",
]);
const SUMMARY_MODELS = new Set(["facebook/bart-large-cnn"]);

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (HF_TOKEN) h["Authorization"] = `Bearer ${HF_TOKEN}`;
  return h;
}

async function callChatCompletions(model: ModelEntry, messages: HfMessage[], temperature?: number): Promise<string> {
  // Hugging Face Router exposes an OpenAI-compatible endpoint.
  const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      model: model.id,
      messages,
      temperature: temperature ?? 0.7,
      max_tokens: 1024,
      stream: false,
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HF chat completions failed (${res.status}): ${txt.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const reply = data.choices?.[0]?.message?.content;
  if (!reply) throw new Error("Empty response from model");
  return reply;
}

async function callTaskInference(model: ModelEntry, payload: unknown): Promise<unknown> {
  const res = await fetch(`https://api-inference.huggingface.co/models/${model.id}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HF inference failed (${res.status}): ${txt.slice(0, 400)}`);
  }
  return res.json();
}

function lastUserText(messages: HfMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content;
  }
  return messages[messages.length - 1]?.content ?? "";
}

export async function runInference(
  model: ModelEntry,
  messages: HfMessage[],
  temperature?: number,
): Promise<string> {
  if (!HF_TOKEN) {
    throw new Error("HF_TOKEN is not configured. Set it in Replit Secrets.");
  }

  // Specialised task models can't take a chat array.
  if (TRANSLATION_MODELS.has(model.id)) {
    const out = (await callTaskInference(model, {
      inputs: lastUserText(messages),
    })) as { translation_text?: string }[] | { translation_text?: string };
    if (Array.isArray(out)) return out[0]?.translation_text ?? "(no translation)";
    return out.translation_text ?? "(no translation)";
  }

  if (SUMMARY_MODELS.has(model.id)) {
    const out = (await callTaskInference(model, {
      inputs: lastUserText(messages),
      parameters: { max_length: 200, min_length: 40 },
    })) as { summary_text?: string }[] | { summary_text?: string };
    if (Array.isArray(out)) return out[0]?.summary_text ?? "(no summary)";
    return out.summary_text ?? "(no summary)";
  }

  return callChatCompletions(model, messages, temperature);
}

export function hasHfToken(): boolean {
  return Boolean(HF_TOKEN);
}

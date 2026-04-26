import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { SendChatBody } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { conversationsTable, chatMessagesTable } from "@workspace/db";
import { routePrompt } from "../lib/router";
import { runInference, hasHfToken, type HfMessage } from "../lib/hf-inference";
import { extractArtifact } from "../lib/artifact-extractor";
import { ALKABRAIN_PERSONA } from "../lib/persona";
import { findModel } from "../lib/models";
import {
  getActiveTier,
  getTodayUsage,
  bumpUsage,
  nextResetUtc,
  TIERS,
} from "../lib/billing";
import { runCodingDuo } from "../lib/multi-agent";

const router: IRouter = Router();

const ALKABRAIN_LABEL = "ALKABRAIN";

const FALLBACK_MODEL_IDS = [
  "meta-llama/Meta-Llama-3.1-8B-Instruct",
  "meta-llama/Llama-3.3-70B-Instruct",
  "Qwen/Qwen2.5-7B-Instruct",
];

async function inferWithFallback(
  primaryId: string,
  messages: HfMessage[],
  temperature?: number,
): Promise<{ reply: string }> {
  const tried = new Set<string>();
  const order = [primaryId, ...FALLBACK_MODEL_IDS.filter((m) => m !== primaryId)];
  let lastErr: unknown = null;
  for (const id of order) {
    if (tried.has(id)) continue;
    tried.add(id);
    const m = findModel(id);
    if (!m) continue;
    try {
      const reply = await runInference(m, messages, temperature);
      return { reply };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("All models failed");
}

function deriveTitle(text: string): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) return "New chat";
  return trimmed.length > 60 ? trimmed.slice(0, 57) + "…" : trimmed;
}

router.post("/chat", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res
      .status(401)
      .json({ error: "Please sign in to chat with ALKABRAIN." });
  }
  const userId = req.user.id;

  const parsed = SendChatBody.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Invalid request", issues: parsed.error.issues });
  }
  if (!hasHfToken()) {
    return res.status(503).json({ error: "AI backend not configured." });
  }

  const tier = await getActiveTier(userId);
  const tierDef = TIERS[tier];
  const used = await getTodayUsage(userId);

  if (used >= tierDef.dailyMessages) {
    const resetAt = nextResetUtc();
    const retryAfterSec = Math.max(
      1,
      Math.floor((resetAt.getTime() - Date.now()) / 1000),
    );
    res.setHeader("Retry-After", String(retryAfterSec));
    return res.status(429).json({
      error: `You've hit your daily limit on the ${tierDef.name} plan. Take a short break — your quota refreshes at midnight UTC, or upgrade to keep going.`,
      tier,
      used,
      limit: tierDef.dailyMessages,
      resetAt: resetAt.toISOString(),
      retryAfterSec,
      upgradeUrl: tier === "pro" ? null : "/pricing",
    });
  }

  const { messages, modelId, temperature, conversationId, mode } =
    parsed.data as {
      messages: HfMessage[];
      modelId?: string | null;
      temperature?: number | null;
      conversationId?: number | null;
      mode?: "fast" | "planning" | "pro" | null;
    };

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const promptText = lastUser?.content ?? "";

  // Resolve / create conversation
  let convId: number | null = null;
  if (conversationId) {
    const [existing] = await db
      .select()
      .from(conversationsTable)
      .where(
        and(
          eq(conversationsTable.id, conversationId),
          eq(conversationsTable.userId, userId),
        ),
      );
    if (existing) convId = existing.id;
  }
  if (!convId) {
    const [created] = await db
      .insert(conversationsTable)
      .values({ userId, title: deriveTitle(promptText) })
      .returning();
    convId = created.id;
  }

  // Persist incoming user message
  if (lastUser?.content) {
    await db.insert(chatMessagesTable).values({
      conversationId: convId,
      role: "user",
      content: lastUser.content,
    });
  }

  const MODE_OVERRIDES: Record<string, string> = {
    fast: "meta-llama/Meta-Llama-3.1-8B-Instruct",
    planning: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
    pro: "meta-llama/Llama-3.3-70B-Instruct",
  };
  const MODE_PERSONA: Record<string, string> = {
    fast: "\n\nYou are in FAST mode — keep replies short, snappy, and to the point. No fluff.",
    planning:
      "\n\nYou are in PLANNING mode — think step-by-step, lay out a clear plan with numbered steps and trade-offs before answering.",
    pro: "\n\nYou are in PRO mode — give a thorough, expert-level answer with depth, examples, and edge cases.",
  };

  const effectiveModelId = modelId ?? (mode ? MODE_OVERRIDES[mode] : undefined);
  const decision = routePrompt(promptText, effectiveModelId);

  const personaText =
    ALKABRAIN_PERSONA + (mode ? MODE_PERSONA[mode] ?? "" : "");
  const finalMessages: HfMessage[] = messages.some((m) => m.role === "system")
    ? messages
    : [{ role: "system", content: personaText }, ...messages];

  const useDuo =
    tierDef.multiAgent && decision.intent === "code" && !modelId && mode !== "fast";

  const started = Date.now();
  try {
    let replyText: string;
    if (useDuo) {
      try {
        const duo = await runCodingDuo(finalMessages, temperature ?? undefined);
        replyText = duo.reply;
      } catch {
        const r = await inferWithFallback(
          decision.model.id,
          finalMessages,
          temperature ?? undefined,
        );
        replyText = r.reply;
      }
    } else {
      const r = await inferWithFallback(
        decision.model.id,
        finalMessages,
        temperature ?? undefined,
      );
      replyText = r.reply;
    }

    const latencyMs = Date.now() - started;
    const artifact = extractArtifact(replyText);
    await bumpUsage(userId);

    // Persist assistant reply + bump conversation timestamp
    await db.insert(chatMessagesTable).values({
      conversationId: convId,
      role: "assistant",
      content: replyText,
    });
    await db
      .update(conversationsTable)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversationsTable.id, convId));

    return res.json({
      reply: replyText,
      modelId: ALKABRAIN_LABEL,
      modelLabel: ALKABRAIN_LABEL,
      intent: "general",
      latencyMs,
      conversationId: convId,
      artifact,
      routerReason: null,
      agents: null,
    });
  } catch (err) {
    req.log.error({ err }, "Chat inference failed");
    return res.status(502).json({
      error: "Something went wrong on my side. Please try again in a moment.",
    });
  }
});

export default router;

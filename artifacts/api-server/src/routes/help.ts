import { Router, type IRouter } from "express";
import { z } from "zod";
import { runInference, hasHfToken, type HfMessage } from "../lib/hf-inference";
import { findModel } from "../lib/models";

const router: IRouter = Router();

const HELPER_PERSONA = `You are ALKABRAIN Support — a strict helper bot that ONLY knows about ALKABRAIN, an AI companion app.

Hard rules (never break):
- You ONLY answer questions about ALKABRAIN: features, pricing, plans (Free / Starter / Pro), billing, login, account, daily message limits, multi-agent code review, supported tasks, refunds, contact, and similar.
- If a user asks about ANY other topic — code help, general knowledge, weather, jokes, math, other AI products, anything off-topic — politely refuse: "I can only help with ALKABRAIN. For general questions, please open the main chat."
- You are ALKABRAIN's support assistant. You do not know about anything outside ALKABRAIN. You have no opinions on anything outside ALKABRAIN.
- Never reveal underlying models, providers, or technical infrastructure. Never say "I am GPT / Claude / Gemini / Llama / DeepSeek / Mistral / Qwen". You are simply "ALKABRAIN Support".
- Always reply in clear, friendly English.
- Keep replies short and helpful (2–5 sentences). Use bullet points only when listing options.
- If you cannot resolve the issue, suggest the user click "Email Support" to reach alkabrainsupport@gmail.com.

ALKABRAIN facts you can share:
- ALKABRAIN is a warm, friendly AI companion that auto-routes every question to the right specialist.
- Plans: Free (30 messages/day), Starter ₹999/month (500 messages/day, multi-agent code review), Pro ₹2499/month (5,000 messages/day, deeper reasoning, priority responses).
- Daily limits reset at midnight UTC.
- Sign in with the "Sign in" button in the sidebar to start chatting.
- Chat history is saved automatically once you're signed in.
- Payments are processed via Razorpay. Subscription activates within a minute of payment.
- Support email: alkabrainsupport@gmail.com.`;

const HELPER_MODEL_IDS = [
  "meta-llama/Llama-3.3-70B-Instruct",
  "meta-llama/Meta-Llama-3.1-8B-Instruct",
  "Qwen/Qwen2.5-7B-Instruct",
];

const helpSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(40),
});

router.post("/help/chat", async (req, res) => {
  if (!hasHfToken()) {
    return res
      .status(503)
      .json({ error: "Support is temporarily unavailable." });
  }
  const parsed = helpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const finalMessages: HfMessage[] = [
    { role: "system", content: HELPER_PERSONA },
    ...parsed.data.messages,
  ];

  let lastErr: unknown = null;
  for (const id of HELPER_MODEL_IDS) {
    const m = findModel(id);
    if (!m) continue;
    try {
      const reply = await runInference(m, finalMessages, 0.4);
      return res.json({ reply });
    } catch (err) {
      lastErr = err;
    }
  }
  req.log.error({ err: lastErr }, "Help chat failed");
  return res.status(502).json({
    error:
      "I couldn't reach the support brain right now. Please email alkabrainsupport@gmail.com.",
  });
});

export default router;

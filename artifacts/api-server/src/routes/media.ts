import { Router, type IRouter } from "express";
import { z } from "zod";
import {
  getActiveTier,
  getTodayUsage,
  bumpUsage,
  nextResetUtc,
  TIERS,
} from "../lib/billing";

const router: IRouter = Router();

const HF_TOKEN = process.env["HF_TOKEN"];

const IMAGE_MODELS = [
  "black-forest-labs/FLUX.1-schnell",
  "stabilityai/stable-diffusion-xl-base-1.0",
  "stabilityai/stable-diffusion-3.5-large-turbo",
];

const VIDEO_MODELS = [
  "ali-vilab/text-to-video-ms-1.7b",
  "ByteDance/AnimateDiff-Lightning",
];

const GenBody = z.object({
  prompt: z.string().min(1).max(2000),
  modelId: z.string().optional(),
});

async function callBinaryInference(
  modelId: string,
  prompt: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(
    `https://api-inference.huggingface.co/models/${modelId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {}),
      },
      body: JSON.stringify({ inputs: prompt }),
    },
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HF inference (${modelId}) ${res.status}: ${txt.slice(0, 300)}`);
  }
  const ct = res.headers.get("content-type") ?? "application/octet-stream";
  if (ct.includes("application/json")) {
    const j = await res.json().catch(() => ({}));
    throw new Error(
      `Model returned JSON (likely loading): ${JSON.stringify(j).slice(0, 300)}`,
    );
  }
  const arr = await res.arrayBuffer();
  return { buffer: Buffer.from(arr), contentType: ct };
}

async function tryModels(
  models: string[],
  prompt: string,
): Promise<{ buffer: Buffer; contentType: string; modelId: string }> {
  let lastErr: unknown = null;
  for (const m of models) {
    try {
      const r = await callBinaryInference(m, prompt);
      return { ...r, modelId: m };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("All media models failed");
}

async function gateRequest(req: any, res: any): Promise<boolean> {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Please sign in." });
    return false;
  }
  if (!HF_TOKEN) {
    res.status(503).json({ error: "Media backend not configured." });
    return false;
  }
  const tier = await getActiveTier(req.user.id);
  const tierDef = TIERS[tier];
  const used = await getTodayUsage(req.user.id);
  if (used >= tierDef.dailyMessages) {
    const resetAt = nextResetUtc();
    res.status(429).json({
      error: `Daily limit reached on ${tierDef.name}.`,
      resetAt: resetAt.toISOString(),
    });
    return false;
  }
  return true;
}

router.post("/image/generate", async (req, res) => {
  if (!(await gateRequest(req, res))) return;
  const parsed = GenBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }
  const order = parsed.data.modelId
    ? [parsed.data.modelId, ...IMAGE_MODELS]
    : IMAGE_MODELS;
  try {
    const r = await tryModels(order, parsed.data.prompt);
    await bumpUsage(req.user.id);
    const dataUrl = `data:${r.contentType};base64,${r.buffer.toString("base64")}`;
    return res.json({
      kind: "image",
      modelId: r.modelId,
      dataUrl,
      prompt: parsed.data.prompt,
    });
  } catch (err: any) {
    req.log.error({ err }, "Image gen failed");
    return res.status(502).json({
      error:
        "Image model is busy or warming up. Please try again in a moment.",
    });
  }
});

router.post("/video/generate", async (req, res) => {
  if (!(await gateRequest(req, res))) return;
  const parsed = GenBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }
  const order = parsed.data.modelId
    ? [parsed.data.modelId, ...VIDEO_MODELS]
    : VIDEO_MODELS;
  try {
    const r = await tryModels(order, parsed.data.prompt);
    await bumpUsage(req.user.id);
    const dataUrl = `data:${r.contentType};base64,${r.buffer.toString("base64")}`;
    return res.json({
      kind: "video",
      modelId: r.modelId,
      dataUrl,
      prompt: parsed.data.prompt,
    });
  } catch (err: any) {
    req.log.error({ err }, "Video gen failed");
    return res.status(502).json({
      error:
        "Video model is busy or warming up. Free HF video models can take 60–120s — please try again in a moment.",
    });
  }
});

export default router;

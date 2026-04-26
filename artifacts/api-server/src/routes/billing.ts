import { Router, type IRouter } from "express";
import {
  TIERS,
  getActiveTier,
  getActiveSubscription,
  getTodayUsage,
  nextResetUtc,
} from "../lib/billing";

const router: IRouter = Router();

router.get("/billing/tiers", (_req, res) => {
  res.json({ tiers: Object.values(TIERS) });
});

router.get("/billing/me", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Please sign in." });
  }
  const userId = req.user.id;
  const tierId = await getActiveTier(userId);
  const tier = TIERS[tierId];
  const sub = await getActiveSubscription(userId);
  const messagesToday = await getTodayUsage(userId);
  const resetAt = nextResetUtc();
  res.json({
    tier,
    subscription: sub
      ? {
          status: sub.status,
          startedAt: sub.startedAt.toISOString(),
          currentPeriodEnd: sub.currentPeriodEnd
            ? sub.currentPeriodEnd.toISOString()
            : null,
        }
      : null,
    usage: {
      messagesToday,
      dailyLimit: tier.dailyMessages,
      resetAt: resetAt.toISOString(),
      remaining: Math.max(0, tier.dailyMessages - messagesToday),
    },
  });
});

export default router;

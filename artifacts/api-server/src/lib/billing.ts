import { db, subscriptionsTable, usageDailyTable } from "@workspace/db";
import { and, desc, eq, gt } from "drizzle-orm";

export type TierId = "free" | "starter" | "pro";

export interface TierDef {
  id: TierId;
  name: string;
  priceInr: number;
  priceLabel: string;
  dailyMessages: number;
  multiAgent: boolean;
  allModels: boolean;
  priorityRouting: boolean;
  paymentLink: string | null;
  features: string[];
}

export const TIERS: Record<TierId, TierDef> = {
  free: {
    id: "free",
    name: "Free",
    priceInr: 0,
    priceLabel: "Free",
    dailyMessages: 30,
    multiAgent: false,
    allModels: false,
    priorityRouting: false,
    paymentLink: null,
    features: [
      "30 messages per day",
      "Friendly conversational answers",
      "Artifacts panel for code & diagrams",
      "Community support",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceInr: 999,
    priceLabel: "₹999 / month",
    dailyMessages: 500,
    multiAgent: true,
    allModels: true,
    priorityRouting: false,
    paymentLink: "https://rzp.io/rzp/vXngZyC4",
    features: [
      "500 messages per day",
      "Stronger answers across coding, writing & analysis",
      "Multi-agent code review on every coding question",
      "Translation & summarization built in",
      "Artifacts viewer + downloads",
      "Email support",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceInr: 2499,
    priceLabel: "₹2499 / month",
    dailyMessages: 5000,
    multiAgent: true,
    allModels: true,
    priorityRouting: true,
    paymentLink: "https://rzp.io/rzp/UudyBfFv",
    features: [
      "5,000 messages per day",
      "Everything in Starter",
      "Deeper reasoning & second-pass review on tough questions",
      "Priority access to ALKABRAIN's flagship intelligence",
      "Faster responses",
      "Priority support",
    ],
  },
};

export function tierFromAmountPaise(paise: number): TierId | null {
  if (paise === 99900) return "starter";
  if (paise === 249900) return "pro";
  return null;
}

export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function nextResetUtc(d = new Date()): Date {
  const r = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0),
  );
  return r;
}

export async function getActiveTier(userId: string): Promise<TierId> {
  const now = new Date();
  const [row] = await db
    .select()
    .from(subscriptionsTable)
    .where(
      and(
        eq(subscriptionsTable.userId, userId),
        eq(subscriptionsTable.status, "active"),
        gt(subscriptionsTable.currentPeriodEnd, now),
      ),
    )
    .orderBy(desc(subscriptionsTable.startedAt))
    .limit(1);
  if (!row) return "free";
  return (row.tier as TierId) ?? "free";
}

export async function getActiveSubscription(userId: string) {
  const now = new Date();
  const [row] = await db
    .select()
    .from(subscriptionsTable)
    .where(
      and(
        eq(subscriptionsTable.userId, userId),
        eq(subscriptionsTable.status, "active"),
        gt(subscriptionsTable.currentPeriodEnd, now),
      ),
    )
    .orderBy(desc(subscriptionsTable.startedAt))
    .limit(1);
  return row ?? null;
}

export async function getTodayUsage(userId: string): Promise<number> {
  const day = todayKey();
  const [row] = await db
    .select()
    .from(usageDailyTable)
    .where(
      and(eq(usageDailyTable.userId, userId), eq(usageDailyTable.day, day)),
    )
    .limit(1);
  return row?.messages ?? 0;
}

export async function bumpUsage(
  userId: string,
  tokensIn = 0,
  tokensOut = 0,
): Promise<void> {
  const day = todayKey();
  const [existing] = await db
    .select()
    .from(usageDailyTable)
    .where(
      and(eq(usageDailyTable.userId, userId), eq(usageDailyTable.day, day)),
    )
    .limit(1);
  if (existing) {
    await db
      .update(usageDailyTable)
      .set({
        messages: existing.messages + 1,
        tokensIn: existing.tokensIn + tokensIn,
        tokensOut: existing.tokensOut + tokensOut,
      })
      .where(eq(usageDailyTable.id, existing.id));
  } else {
    await db.insert(usageDailyTable).values({
      userId,
      day,
      messages: 1,
      tokensIn,
      tokensOut,
    });
  }
}

export async function upsertSubscriptionByPayment(opts: {
  userId: string;
  tier: TierId;
  razorpayPaymentId: string;
  razorpayOrderId?: string | null;
  amountPaise: number;
}): Promise<void> {
  const startedAt = new Date();
  const periodEnd = new Date(startedAt);
  periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);
  await db.insert(subscriptionsTable).values({
    userId: opts.userId,
    tier: opts.tier,
    status: "active",
    razorpayPaymentId: opts.razorpayPaymentId,
    razorpayOrderId: opts.razorpayOrderId ?? null,
    amountPaise: opts.amountPaise,
    currency: "INR",
    startedAt,
    currentPeriodEnd: periodEnd,
  });
}

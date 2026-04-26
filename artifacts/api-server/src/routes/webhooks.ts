import { Router, type IRouter, type Request, type Response } from "express";
import express from "express";
import crypto from "node:crypto";
import { db, paymentsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  tierFromAmountPaise,
  upsertSubscriptionByPayment,
} from "../lib/billing";

const router: IRouter = Router();

const WEBHOOK_SECRET = process.env["RAZORPAY_WEBHOOK_SECRET"];

function verifySignature(rawBody: Buffer, signature: string | undefined): boolean {
  if (!WEBHOOK_SECRET || !signature) return false;
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex"),
    );
  } catch {
    return false;
  }
}

router.post(
  "/webhooks/razorpay",
  express.raw({ type: "*/*", limit: "1mb" }),
  async (req: Request, res: Response) => {
    const sig = req.header("x-razorpay-signature");
    const rawBody = req.body as Buffer;
    if (!Buffer.isBuffer(rawBody)) {
      return res.status(400).json({ error: "Invalid body" });
    }
    if (!verifySignature(rawBody, sig)) {
      req.log.warn("Razorpay webhook signature mismatch");
      return res.status(400).json({ error: "Invalid signature" });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return res.status(400).json({ error: "Invalid JSON" });
    }

    const event = payload?.event as string | undefined;
    const paymentEntity = payload?.payload?.payment?.entity ?? null;
    if (!paymentEntity) {
      return res.json({ ok: true });
    }

    const paymentId = paymentEntity.id as string;
    const orderId = paymentEntity.order_id as string | null;
    const amount = paymentEntity.amount as number;
    const currency = paymentEntity.currency as string;
    const status = paymentEntity.status as string;
    const email = (paymentEntity.email as string | null) ?? null;
    const contact = (paymentEntity.contact as string | null) ?? null;

    // Try to attach a user by email
    let userId: string | null = null;
    if (email) {
      const [u] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);
      if (u) userId = u.id;
    }

    // Record payment idempotently
    try {
      await db
        .insert(paymentsTable)
        .values({
          razorpayPaymentId: paymentId,
          razorpayOrderId: orderId,
          userId,
          email,
          contact,
          amountPaise: amount,
          currency,
          status,
          eventType: event ?? null,
          raw: payload,
        })
        .onConflictDoNothing({ target: paymentsTable.razorpayPaymentId });
    } catch (err) {
      req.log.error({ err }, "Failed to record payment");
    }

    if (event === "payment.captured" && status === "captured" && userId) {
      const tier = tierFromAmountPaise(amount);
      if (tier) {
        try {
          await upsertSubscriptionByPayment({
            userId,
            tier,
            razorpayPaymentId: paymentId,
            razorpayOrderId: orderId,
            amountPaise: amount,
          });
          req.log.info(
            { userId, tier, paymentId },
            "Subscription activated via Razorpay",
          );
        } catch (err) {
          req.log.error({ err }, "Failed to upsert subscription");
        }
      }
    }

    res.json({ ok: true });
  },
);

export default router;

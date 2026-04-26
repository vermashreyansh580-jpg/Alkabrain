import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const subscriptionsTable = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").notNull(),
    tier: varchar("tier").notNull(),
    status: varchar("status").notNull().default("active"),
    razorpayPaymentId: varchar("razorpay_payment_id"),
    razorpayOrderId: varchar("razorpay_order_id"),
    amountPaise: integer("amount_paise"),
    currency: varchar("currency").default("INR"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_sub_user").on(t.userId)],
);

export const paymentsTable = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    razorpayPaymentId: varchar("razorpay_payment_id").notNull().unique(),
    razorpayOrderId: varchar("razorpay_order_id"),
    userId: varchar("user_id"),
    email: varchar("email"),
    contact: varchar("contact"),
    amountPaise: integer("amount_paise").notNull(),
    currency: varchar("currency").notNull().default("INR"),
    status: varchar("status").notNull(),
    eventType: varchar("event_type"),
    raw: jsonb("raw"),
    capturedAt: timestamp("captured_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_pay_user").on(t.userId), index("idx_pay_email").on(t.email)],
);

export const usageDailyTable = pgTable(
  "usage_daily",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").notNull(),
    day: varchar("day").notNull(), // YYYY-MM-DD UTC
    messages: integer("messages").notNull().default(0),
    tokensIn: integer("tokens_in").notNull().default(0),
    tokensOut: integer("tokens_out").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("idx_usage_user_day").on(t.userId, t.day)],
);

export type Subscription = typeof subscriptionsTable.$inferSelect;
export type Payment = typeof paymentsTable.$inferSelect;
export type UsageDaily = typeof usageDailyTable.$inferSelect;

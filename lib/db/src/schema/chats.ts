import {
  index,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
} from "drizzle-orm/pg-core";

export const conversationsTable = pgTable(
  "conversations",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").notNull(),
    title: varchar("title", { length: 200 }).notNull().default("New chat"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_conv_user").on(t.userId),
    index("idx_conv_user_last").on(t.userId, t.lastMessageAt),
  ],
);

export const chatMessagesTable = pgTable(
  "chat_messages",
  {
    id: serial("id").primaryKey(),
    conversationId: integer("conversation_id").notNull(),
    role: varchar("role", { length: 16 }).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_msg_conv").on(t.conversationId, t.createdAt)],
);

export type Conversation = typeof conversationsTable.$inferSelect;
export type ChatMessageRow = typeof chatMessagesTable.$inferSelect;

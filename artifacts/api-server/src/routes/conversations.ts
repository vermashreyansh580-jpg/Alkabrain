import { Router, type IRouter } from "express";
import { z } from "zod";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { conversationsTable, chatMessagesTable } from "@workspace/db";

const router: IRouter = Router();

function requireAuth(
  req: Parameters<Parameters<IRouter["get"]>[1]>[0],
  res: Parameters<Parameters<IRouter["get"]>[1]>[1],
): string | null {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Sign in required." });
    return null;
  }
  return req.user.id;
}

router.get("/conversations", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const rows = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.userId, userId))
    .orderBy(desc(conversationsTable.lastMessageAt))
    .limit(500);
  return res.json({ conversations: rows });
});

const renameSchema = z.object({ title: z.string().min(1).max(200) });

router.patch("/conversations/:id", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });
  const parsed = renameSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Invalid title" });
  const [updated] = await db
    .update(conversationsTable)
    .set({ title: parsed.data.title.slice(0, 200) })
    .where(
      and(
        eq(conversationsTable.id, id),
        eq(conversationsTable.userId, userId),
      ),
    )
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.json({ conversation: updated });
});

router.delete("/conversations/:id", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });
  const [existing] = await db
    .select()
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.id, id),
        eq(conversationsTable.userId, userId),
      ),
    );
  if (!existing) return res.status(404).json({ error: "Not found" });
  await db
    .delete(chatMessagesTable)
    .where(eq(chatMessagesTable.conversationId, id));
  await db.delete(conversationsTable).where(eq(conversationsTable.id, id));
  return res.json({ ok: true });
});

router.get("/conversations/:id/messages", async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });
  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.id, id),
        eq(conversationsTable.userId, userId),
      ),
    );
  if (!conv) return res.status(404).json({ error: "Not found" });
  const rows = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.conversationId, id))
    .orderBy(asc(chatMessagesTable.createdAt));
  return res.json({
    conversation: conv,
    messages: rows,
  });
});

export default router;

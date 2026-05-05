import { Router, Request, Response } from "express";
import { db, notesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateNoteBody, UpdateNoteBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { encrypt, decrypt } from "../lib/encryption";

const router = Router();

router.get("/", requireAuth, async (req: Request, res: Response) => {
  const rows = await db
    .select()
    .from(notesTable)
    .where(eq(notesTable.userId, req.session.userId!))
    .orderBy(notesTable.updatedAt);

  const notes = rows.map((row) => {
    try {
      return {
        id: row.id,
        userId: row.userId,
        title: row.title,
        content: decrypt({
          encryptedContent: row.encryptedContent,
          iv: row.iv,
          authTag: row.authTag,
        }),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    } catch {
      return {
        id: row.id,
        userId: row.userId,
        title: row.title,
        content: "[Decryption failed]",
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    }
  });

  res.json(notes);
});

router.post("/", requireAuth, async (req: Request, res: Response) => {
  const parse = CreateNoteBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Validation failed: " + parse.error.issues.map((i: { message: string }) => i.message).join(", ") });
    return;
  }

  const { title, content } = parse.data;
  const { encryptedContent, iv, authTag } = encrypt(content);

  const [row] = await db
    .insert(notesTable)
    .values({
      userId: req.session.userId!,
      title,
      encryptedContent,
      iv,
      authTag,
    })
    .returning();

  res.status(201).json({
    id: row.id,
    userId: row.userId,
    title: row.title,
    content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
});

router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid note ID" });
    return;
  }

  const rows = await db
    .select()
    .from(notesTable)
    .where(and(eq(notesTable.id, id), eq(notesTable.userId, req.session.userId!)))
    .limit(1);

  const row = rows[0];
  if (!row) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  let content: string;
  try {
    content = decrypt({ encryptedContent: row.encryptedContent, iv: row.iv, authTag: row.authTag });
  } catch {
    res.status(500).json({ error: "Decryption failed" });
    return;
  }

  res.json({
    id: row.id,
    userId: row.userId,
    title: row.title,
    content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
});

router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid note ID" });
    return;
  }

  const parse = UpdateNoteBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Validation failed: " + parse.error.issues.map((i: { message: string }) => i.message).join(", ") });
    return;
  }

  const existing = await db
    .select()
    .from(notesTable)
    .where(and(eq(notesTable.id, id), eq(notesTable.userId, req.session.userId!)))
    .limit(1);

  if (!existing[0]) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  const { title, content } = parse.data;
  const { encryptedContent, iv, authTag } = encrypt(content);

  const [row] = await db
    .update(notesTable)
    .set({ title, encryptedContent, iv, authTag, updatedAt: new Date() })
    .where(eq(notesTable.id, id))
    .returning();

  res.json({
    id: row.id,
    userId: row.userId,
    title: row.title,
    content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
});

router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid note ID" });
    return;
  }

  const existing = await db
    .select()
    .from(notesTable)
    .where(and(eq(notesTable.id, id), eq(notesTable.userId, req.session.userId!)))
    .limit(1);

  if (!existing[0]) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  await db.delete(notesTable).where(eq(notesTable.id, id));

  res.json({ message: "Note deleted successfully" });
});

export default router;

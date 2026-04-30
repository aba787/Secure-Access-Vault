import { Router, Request, Response } from "express";
import { db, usersTable, auditLogsTable } from "@workspace/db";
import { eq, desc, count, and, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/users", requireAdmin, async (req: Request, res: Response) => {
  const users = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      role: usersTable.role,
      failedAttempts: usersTable.failedAttempts,
      isLocked: usersTable.isLocked,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt));

  res.json(users);
});

router.post("/users/:id/unlock", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  const user = users[0];

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await db
    .update(usersTable)
    .set({ isLocked: false, failedAttempts: 0 })
    .where(eq(usersTable.id, id));

  await db.insert(auditLogsTable).values({
    userId: req.session.userId!,
    username: req.session.username!,
    action: "admin_unlock",
    ipAddress: req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ?? req.socket.remoteAddress ?? null,
    details: `Unlocked account for user: ${user.username}`,
  });

  res.json({ message: `Account for "${user.username}" has been unlocked` });
});

router.get("/logs", requireAdmin, async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const action = req.query.action as string | undefined;

  let query = db
    .select()
    .from(auditLogsTable)
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(limit);

  if (action) {
    const logs = await db
      .select()
      .from(auditLogsTable)
      .where(eq(auditLogsTable.action, action))
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(limit);
    res.json(logs);
    return;
  }

  const logs = await query;
  res.json(logs);
});

router.get("/stats", requireAdmin, async (req: Request, res: Response) => {
  const [totalUsersResult] = await db.select({ count: count() }).from(usersTable);
  const [lockedResult] = await db
    .select({ count: count() })
    .from(usersTable)
    .where(eq(usersTable.isLocked, true));
  const [adminCountResult] = await db
    .select({ count: count() })
    .from(usersTable)
    .where(eq(usersTable.role, "admin"));
  const [userCountResult] = await db
    .select({ count: count() })
    .from(usersTable)
    .where(eq(usersTable.role, "user"));

  const [totalLoginAttemptsResult] = await db
    .select({ count: count() })
    .from(auditLogsTable)
    .where(sql`${auditLogsTable.action} IN ('login', 'login_failed')`);

  const [failedLoginAttemptsResult] = await db
    .select({ count: count() })
    .from(auditLogsTable)
    .where(eq(auditLogsTable.action, "login_failed"));

  const recentActivity = await db
    .select()
    .from(auditLogsTable)
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(10);

  res.json({
    totalUsers: Number(totalUsersResult.count),
    lockedAccounts: Number(lockedResult.count),
    adminCount: Number(adminCountResult.count),
    userCount: Number(userCountResult.count),
    totalLoginAttempts: Number(totalLoginAttemptsResult.count),
    failedLoginAttempts: Number(failedLoginAttemptsResult.count),
    recentActivity,
  });
});

export default router;

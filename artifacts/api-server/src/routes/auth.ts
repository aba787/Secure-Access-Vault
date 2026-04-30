import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { db, usersTable, auditLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const MAX_FAILED_ATTEMPTS = 3;
const SALT_ROUNDS = 12;

async function logAudit(
  userId: number | null,
  username: string | null,
  action: string,
  ipAddress: string | null,
  details?: string,
) {
  try {
    await db.insert(auditLogsTable).values({
      userId,
      username,
      action,
      ipAddress,
      details: details ?? null,
    });
  } catch {
    // Non-critical — never let logging fail a request
  }
}

function getIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress ?? "unknown";
}

router.post("/register", async (req: Request, res: Response) => {
  const parse = RegisterBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Validation failed: " + parse.error.issues.map((i) => i.message).join(", ") });
    return;
  }

  const { username, password, role } = parse.data;
  const ip = getIp(req);

  const existing = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [user] = await db
    .insert(usersTable)
    .values({ username, passwordHash, role: role ?? "user" })
    .returning();

  req.session.userId = user.id;
  req.session.username = user.username;
  req.session.role = user.role as "admin" | "user";

  await logAudit(user.id, user.username, "register", ip, `Role: ${user.role}`);

  res.status(201).json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    },
    message: "Account created successfully",
  });
});

router.post("/login", async (req: Request, res: Response) => {
  const parse = LoginBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  const { username, password } = parse.data;
  const ip = getIp(req);

  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  const user = users[0];

  if (!user) {
    await logAudit(null, username, "login_failed", ip, "User not found");
    res.status(401).json({ error: "Invalid credentials", attemptsRemaining: undefined });
    return;
  }

  if (user.isLocked) {
    await logAudit(user.id, user.username, "login_failed", ip, "Account is locked");
    res.status(401).json({ error: "Account is locked. Please contact an administrator.", locked: true });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) {
    const newFailedAttempts = user.failedAttempts + 1;
    const shouldLock = newFailedAttempts >= MAX_FAILED_ATTEMPTS;

    await db
      .update(usersTable)
      .set({
        failedAttempts: newFailedAttempts,
        isLocked: shouldLock,
      })
      .where(eq(usersTable.id, user.id));

    const attemptsRemaining = MAX_FAILED_ATTEMPTS - newFailedAttempts;

    if (shouldLock) {
      await logAudit(user.id, user.username, "account_locked", ip, `Locked after ${newFailedAttempts} failed attempts`);
      res.status(401).json({
        error: "Account has been locked due to too many failed attempts. Contact an administrator.",
        locked: true,
        attemptsRemaining: 0,
      });
    } else {
      await logAudit(user.id, user.username, "login_failed", ip, `Failed attempt ${newFailedAttempts}/${MAX_FAILED_ATTEMPTS}`);
      res.status(401).json({
        error: "Invalid credentials",
        locked: false,
        attemptsRemaining,
      });
    }
    return;
  }

  await db.update(usersTable).set({ failedAttempts: 0 }).where(eq(usersTable.id, user.id));

  req.session.userId = user.id;
  req.session.username = user.username;
  req.session.role = user.role as "admin" | "user";

  await logAudit(user.id, user.username, "login", ip, `Role: ${user.role}`);

  res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    },
    message: "Login successful",
  });
});

router.post("/logout", requireAuth, async (req: Request, res: Response) => {
  const { userId, username } = req.session;
  const ip = getIp(req);

  await logAudit(userId ?? null, username ?? null, "logout", ip);

  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/me", requireAuth, async (req: Request, res: Response) => {
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId!))
    .limit(1);

  const user = users[0];
  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "Session invalid" });
    return;
  }

  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
  });
});

export default router;

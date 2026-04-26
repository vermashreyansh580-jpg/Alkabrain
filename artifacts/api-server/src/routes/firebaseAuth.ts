import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import {
  clearSession,
  createSession,
  getSessionId,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth";

const FIREBASE_API_KEY =
  process.env.FIREBASE_API_KEY ?? "AIzaSyDfwkxrDu84aSavw7tc5yra62__T6ghbVw";

const router: IRouter = Router();

interface FirebaseLookupUser {
  localId: string;
  email?: string;
  displayName?: string;
  photoUrl?: string;
  emailVerified?: boolean;
}

async function verifyIdToken(idToken: string): Promise<FirebaseLookupUser | null> {
  try {
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      },
    );
    if (!r.ok) return null;
    const data = (await r.json()) as { users?: FirebaseLookupUser[] };
    return data.users?.[0] ?? null;
  } catch {
    return null;
  }
}

router.post("/auth/firebase", async (req: Request, res: Response) => {
  const idToken = (req.body as { idToken?: string } | undefined)?.idToken;
  if (!idToken || typeof idToken !== "string") {
    res.status(400).json({ error: "idToken required" });
    return;
  }

  const fbUser = await verifyIdToken(idToken);
  if (!fbUser?.localId) {
    res.status(401).json({ error: "Invalid Firebase ID token" });
    return;
  }

  const displayName = fbUser.displayName ?? "";
  const [firstName, ...rest] = displayName.split(" ");

  const userData = {
    id: `fb:${fbUser.localId}`,
    email: fbUser.email ?? null,
    firstName: firstName || null,
    lastName: rest.length ? rest.join(" ") : null,
    profileImageUrl: fbUser.photoUrl ?? null,
  };

  const [dbUser] = await db
    .insert(usersTable)
    .values(userData)
    .onConflictDoUpdate({
      target: usersTable.id,
      set: { ...userData, updatedAt: new Date() },
    })
    .returning();

  const sessionData: SessionData = {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      profileImageUrl: dbUser.profileImageUrl,
    },
    access_token: idToken,
  };

  const sid = await createSession(sessionData);
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
  res.json({ user: sessionData.user });
});

router.post("/auth/firebase/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.json({ success: true });
});

export default router;

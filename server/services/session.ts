import crypto from 'crypto';
import { db } from '../db';
import { userSessions, users } from '@shared/schema';
import { eq, and, gt } from 'drizzle-orm';

export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createUserSession(
  userId: number, 
  ipAddress?: string, 
  userAgent?: string
): Promise<string> {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TIMEOUT);

  await db.insert(userSessions).values({
    userId,
    sessionToken,
    ipAddress,
    userAgent,
    expiresAt,
  });

  return sessionToken;
}

export async function validateSession(sessionToken: string): Promise<number | null> {
  const [session] = await db
    .select()
    .from(userSessions)
    .where(
      and(
        eq(userSessions.sessionToken, sessionToken),
        eq(userSessions.isActive, true),
        gt(userSessions.expiresAt, new Date())
      )
    );

  if (!session) {
    return null;
  }

  // Update last used timestamp
  await db
    .update(userSessions)
    .set({ 
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + SESSION_TIMEOUT) // Extend session
    })
    .where(eq(userSessions.id, session.id));

  // Update user's last active timestamp
  await db
    .update(users)
    .set({ lastActiveAt: new Date() })
    .where(eq(users.id, session.userId));

  return session.userId;
}

export async function invalidateSession(sessionToken: string): Promise<void> {
  await db
    .update(userSessions)
    .set({ isActive: false })
    .where(eq(userSessions.sessionToken, sessionToken));
}

export async function invalidateAllUserSessions(userId: number): Promise<void> {
  await db
    .update(userSessions)
    .set({ isActive: false })
    .where(eq(userSessions.userId, userId));
}

export async function cleanupExpiredSessions(): Promise<void> {
  await db
    .update(userSessions)
    .set({ isActive: false })
    .where(
      and(
        eq(userSessions.isActive, true),
        gt(userSessions.expiresAt, new Date())
      )
    );
}
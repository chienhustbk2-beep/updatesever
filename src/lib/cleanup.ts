import { prisma } from "./prisma";

export async function cleanupOldVisitLogs(): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await prisma.visitLog.deleteMany({
    where: { createdAt: { lt: thirtyDaysAgo } },
  });
  return result.count;
}

export async function cleanupOldSessions(): Promise<number> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const result = await prisma.activeSession.deleteMany({
    where: { lastSeen: { lt: sevenDaysAgo } },
  });
  return result.count;
}

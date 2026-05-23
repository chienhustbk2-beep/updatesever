import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cleanupOldVisitLogs, cleanupOldSessions } from "@/lib/cleanup";

export async function GET() {
  try {
    const session = await auth();
if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 }) }const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
if (!admin || (admin.role !== "ADMIN" && admin.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 }) }

    await cleanupOldVisitLogs();
    await cleanupOldSessions();

    const logs = await prisma.visitLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await prisma.visitLog.count({
      where: { createdAt: { gte: today } },
    });
    const totalVisits = await prisma.visitLog.count();

    return NextResponse.json({ logs, todayCount, totalVisits });
}
catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    ) }
}

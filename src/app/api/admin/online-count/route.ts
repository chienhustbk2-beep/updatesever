import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 }) }const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
if (!admin || (admin.role !== "ADMIN" && admin.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 }) }const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const count = await prisma.activeSession.count({
      where: { lastSeen: { gte: fiveMinutesAgo } },
    });

    return NextResponse.json({ online: count });
}
catch {
    return NextResponse.json({ online: 0 }) }
}

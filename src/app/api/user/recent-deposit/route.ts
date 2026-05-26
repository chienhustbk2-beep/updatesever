import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");

    const where: Record<string, unknown> = {
      userId: session.user.id,
      type: "DEPOSIT",
      status: "SUCCESS",
    };
    if (since) {
      where.createdAt = { gte: new Date(since) };
    }

    const deposits = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        amount: true,
        description: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, deposits });
  } catch (error) {
    console.error("[Recent Deposit] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

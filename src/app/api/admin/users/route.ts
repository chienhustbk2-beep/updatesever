import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role");
    const isActive = searchParams.get("isActive");

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (role) where.role = role;
    if (isActive !== null && isActive !== undefined)
      where.isActive = isActive === "true";

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        accountCode: true,
        balance: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { orders: true, downloads: true, transactions: true },
        },
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

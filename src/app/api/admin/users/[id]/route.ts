import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await checkAdmin();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, name: true, phone: true, accountCode: true,
        lastSeen: true, balance: true, role: true, isActive: true, createdAt: true, updatedAt: true,
        _count: { select: { orders: true, transactions: true, downloads: true, reviews: true, supportTickets: true } },
        orders: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true, orderNumber: true, finalAmount: true, status: true, createdAt: true,
            items: {
              select: {
                id: true, quantity: true, price: true,
                product: { select: { name: true } },
              },
            },
          },
        },
        transactions: {
          orderBy: { createdAt: "desc" },
          select: { id: true, type: true, amount: true, description: true, status: true, createdAt: true },
        },
        downloads: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true, productKey: true, downloadUrl: true, downloadCount: true, createdAt: true,
            order: { select: { orderNumber: true } },
          },
        },
        auditLogs: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: { id: true, action: true, details: true, ipAddress: true, createdAt: true },
        },
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await checkAdmin();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, role, isActive, balanceAdjustment, password } =
      body;

    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) {
      const existing = await prisma.user.findUnique({
        where: { email },
      });
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 },
        );
      }
      updateData.email = email;
    }
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password !== undefined) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }
    if (balanceAdjustment !== undefined) {
      updateData.balance = {
        increment: parseFloat(balanceAdjustment),
      };
    }
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        balance: true,
        role: true,
        isActive: true,
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "UPDATE_USER",
        entity: "User",
        entityId: id,
        details: JSON.stringify({ fields: Object.keys(updateData) }),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

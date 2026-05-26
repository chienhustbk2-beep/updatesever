import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const where: Record<string, unknown> = { productId: id };
    if (search) {
      where.keyValue = { contains: search };
    }
    if (status) {
      where.status = status;
    }
    const keys = await prisma.productKey.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        orderItem: {
          select: {
            id: true,
            order: {
              select: {
                id: true,
                orderNumber: true,
                customerEmail: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });
    return NextResponse.json({ keys });
  } catch (error) {
    console.error("Get keys error:", error);
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
    const body = await request.json();
    const { id: keyId, keyValue, status, note } = body;
    if (!keyId) {
      return NextResponse.json({ error: "Key ID is required" }, { status: 400 });
    }

    const key = await prisma.productKey.findUnique({
      where: { id: keyId },
    });
    if (!key) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }
    const updateData: Record<string, unknown> = {};
    if (keyValue !== undefined) updateData.keyValue = keyValue;
    if (status !== undefined) updateData.status = status;
    if (note !== undefined) updateData.note = note;

    const updatedKey = await prisma.productKey.update({
      where: { id: keyId },
      data: updateData,
    });
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "UPDATE_KEY",
        entity: "ProductKey",
        entityId: keyId,
        details: JSON.stringify({ fields: Object.keys(updateData) }),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });
    return NextResponse.json({ success: true, key: updatedKey });
  } catch (error) {
    console.error("Update key error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await checkAdmin();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await request.json();
    const { id: keyId } = body;
    if (!keyId) {
      return NextResponse.json({ error: "Key ID is required" }, { status: 400 });
    }

    const key = await prisma.productKey.findUnique({
      where: { id: keyId },
    });
    if (!key) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }
    if (key.status === "SOLD") {
      return NextResponse.json(
        { error: "Cannot delete sold key" },
        { status: 400 },
      );
    }

    await prisma.productKey.delete({ where: { id: keyId } });

    if (key.status === "AVAILABLE") {
      await prisma.product.update({
        where: { id: key.productId },
        data: { stock: { decrement: 1 } },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "DELETE_KEY",
        entity: "ProductKey",
        entityId: keyId,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete key error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

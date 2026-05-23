import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}
export async function POST(
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
    const { keyIds, orderItemId } = body;

    if (!keyIds || !Array.isArray(keyIds) || keyIds.length === 0) {
      return NextResponse.json({ error: "Invalid key IDs" }, { status: 400 });
    }
    if (!orderItemId) {
      return NextResponse.json({ error: "orderItemId is required" }, { status: 400 });
    }
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { productKeys: true },
        },
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.status !== "PENDING" && order.status !== "PROCESSING") {
      return NextResponse.json(
        { error: "Order is not in pending or processing state" },
        { status: 400 },
      );
    }
    const orderItem = order.items.find((i) => i.id === orderItemId);
    if (!orderItem) {
      return NextResponse.json({ error: "Order item not found" }, { status: 404 });
    }

    const keys = await prisma.productKey.findMany({
      where: {
        id: { in: keyIds },
        status: "AVAILABLE",
      },
    });
    if (keys.length !== keyIds.length) {
      return NextResponse.json(
        { error: "Some keys are not available" },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.productKey.updateMany({
        where: { id: { in: keyIds } },
        data: {
          status: "SOLD",
          orderItemId: orderItemId,
          soldAt: new Date(),
        },
      });

      const productCounts: Record<string, number> = {};
      for (const key of keys) {
        productCounts[key.productId] = (productCounts[key.productId] || 0) + 1;
      }
      for (const [productId, count] of Object.entries(productCounts)) {
        await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: count } },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "MANUAL_ASSIGN_KEYS",
          entity: "Order",
          entityId: id,
          details: JSON.stringify({ keyIds, orderItemId }),
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        },
      });
    });
    return NextResponse.json({ success: true, assignedCount: keys.length });
  } catch (error) {
    console.error("Assign keys error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

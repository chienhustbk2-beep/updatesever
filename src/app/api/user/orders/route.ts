import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }const userId = session.user.id;

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: true,
            productKeys: true,
          },
        },
      },
    });

    const orderIds = orders.map((o) => o.id);
    const purchasedKeys = await prisma.productKey.findMany({
      where: {
        orderItem: {
          orderId: { in: orderIds },
        },
      },
      include: {
        product: true,
        orderItem: {
          include: { order: { select: { id: true, orderNumber: true, createdAt: true } } },
        },
      },
      orderBy: { soldAt: "desc" },
    });

    return NextResponse.json({ orders, purchasedKeys });
}
catch (error) {
    console.error("Get user orders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    ) }
}
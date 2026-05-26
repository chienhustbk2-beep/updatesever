import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            productKeys: true,
          },
        },
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const showKeys = order.paymentStatus !== "REFUNDED" && order.status !== "CANCELLED";
    const keys = showKeys ? order.items.flatMap((item) =>
      item.productKeys.map((k) => ({
        productName: item.product?.name,
        keyValue: k.keyValue,
      }))
    ) : [];
    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        finalAmount: order.finalAmount,
        createdAt: order.createdAt,
      },
      keys: keys.length > 0 ? keys : undefined,
      message: !showKeys ? "Đơn hàng đã được hoàn tiền/hủy, key không khả dụng." : undefined,
    });
  } catch (error) {
    console.error("Get order error:", error);
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

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

    // Check if order belongs to user
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (action === "cancel") {
      if (order.status !== "PENDING" || order.paymentStatus !== "UNPAID") {
        return NextResponse.json(
          { error: "Chỉ có thể hủy đơn hàng đang chờ thanh toán" },
          { status: 400 },
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id },
          data: { status: "CANCELLED" },
        });

        const allKeys = order.items.flatMap((i) => i.productKeys);
        if (allKeys.length > 0) {
          const keyIds = allKeys.map((k) => k.id);
          await tx.productKey.updateMany({
            where: { id: { in: keyIds } },
            data: {
              status: "COMPROMISED",
              orderItemId: null,
              soldAt: null,
            },
          });
        }
      });
      return NextResponse.json({
        success: true,
        message: "Đã hủy đơn hàng thành công",
      });
    }
    if (action === "removeItem" && body.orderItemId) {
      if (order.status !== "PENDING" || order.paymentStatus !== "UNPAID") {
        return NextResponse.json(
          { error: "Chỉ có thể xóa sản phẩm khi đơn hàng đang chờ thanh toán" },
          { status: 400 },
        );
      }
      const orderItem = order.items.find(
        (item) => item.id === body.orderItemId,
      );
      if (!orderItem) {
        return NextResponse.json(
          { error: "Sản phẩm không tồn tại trong đơn hàng" },
          { status: 404 },
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.orderItem.delete({
          where: { id: body.orderItemId },
        });

        const productKeysToRemove = order.items
          .flatMap((i) => i.productKeys)
          .filter((k) => k.productId === orderItem.productId);

        if (productKeysToRemove.length > 0) {
          const keyIds = productKeysToRemove.map((k) => k.id);
          await tx.productKey.updateMany({
            where: { id: { in: keyIds } },
            data: {
              status: "COMPROMISED",
              orderItemId: null,
              soldAt: null,
            },
          });
        }
        const remainingItems = await tx.orderItem.findMany({
          where: { orderId: id },
        });
        const newTotal = remainingItems.reduce(
          (sum, item) => sum + item.total,
          0,
        );
        const newFinal = newTotal - order.discountAmount;

        if (remainingItems.length === 0) {
          await tx.order.update({
            where: { id },
            data: { status: "CANCELLED", totalAmount: 0, finalAmount: 0 },
          });
        } else {
          await tx.order.update({
            where: { id },
            data: {
              totalAmount: newTotal,
              finalAmount: Math.max(0, newFinal),
            },
          });
        }
      });
      return NextResponse.json({
        success: true,
        message: "Đã xóa sản phẩm khỏi đơn hàng",
      });
    }
    if (action === "updateQuantity" && body.orderItemId && body.quantity) {
      if (order.status !== "PENDING" || order.paymentStatus !== "UNPAID") {
        return NextResponse.json(
          {
            error:
              "Chỉ có thể thay đổi số lượng khi đơn hàng đang chờ thanh toán",
          },
          { status: 400 },
        );
      }
      const orderItem = order.items.find(
        (item) => item.id === body.orderItemId,
      );
      if (!orderItem) {
        return NextResponse.json(
          { error: "Sản phẩm không tồn tại trong đơn hàng" },
          { status: 404 },
        );
      }
      const newQty = Number(body.quantity);
      if (!Number.isInteger(newQty) || newQty < 1) {
        return NextResponse.json(
          { error: "Số lượng phải là số nguyên dương" },
          { status: 400 },
        );
      }

      await prisma.$transaction(async (tx) => {
        const price = orderItem.price;
        const newTotal = Math.round(price * newQty * 100) / 100;

        await tx.orderItem.update({
          where: { id: body.orderItemId },
          data: { quantity: newQty, total: newTotal },
        });
        const allItems = await tx.orderItem.findMany({
          where: { orderId: id },
        });
        const newOrderTotal = allItems.reduce(
          (sum, item) => sum + item.total,
          0,
        );
        const newFinal = newOrderTotal - order.discountAmount;

        await tx.order.update({
          where: { id },
          data: {
            totalAmount: newOrderTotal,
            finalAmount: Math.max(0, newFinal),
          },
        });
      });
      return NextResponse.json({
        success: true,
        message: "Đã cập nhật số lượng",
      });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Cancel order error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

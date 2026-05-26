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
    if (!admin || (admin.role !== "ADMIN" && admin.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        items: {
          include: {
            product: true,
            productKeys: { include: { product: true } },
          },
        },
        downloads: true,
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const flatKeys = order.items.flatMap((item) =>
      item.productKeys.map((k) => ({
        id: k.id,
        keyValue: k.keyValue,
        status: k.status,
        orderId: k.orderItemId,
        note: k.note,
        soldAt: k.soldAt,
        product: { id: k.product.id, name: k.product.name },
      }))
    );
    return NextResponse.json({ order: { ...order, productKeys: flatKeys } });
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
    const admin = await checkAdmin();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { id } = await params;
    const body = await request.json();
    const { action, status, paymentStatus, note } = body;

    // Get the current order with relationships
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            productKeys: true,
          },
        },
        user: true,
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Handle cancellation (just change status, NO auto-refund)
    if (action === "cancel") {
      if (order.status === "CANCELLED") {
        return NextResponse.json({ error: "Đơn hàng đã bị hủy" }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id },
          data: { status: "CANCELLED" },
        });

        const allKeys = order.items.flatMap((item) => item.productKeys);
        if (allKeys.length > 0) {
          const keyIds = allKeys.map((k) => k.id);
          await tx.productKey.updateMany({
            where: { id: { in: keyIds } },
            data: { status: "COMPROMISED", orderItemId: null, soldAt: null },
          });
        }

        await tx.auditLog.create({
          data: {
            userId: admin.id, action: "CANCEL_ORDER", entity: "Order",
            entityId: id,
            details: JSON.stringify({ previousStatus: order.status }),
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          },
        });
      });
      return NextResponse.json({ success: true, message: "Đã hủy đơn hàng." });
    }

    // Handle refund (separate action, only for paid orders)
    if (action === "refund") {
      if (order.paymentStatus === "REFUNDED") {
        return NextResponse.json({ error: "Đơn hàng đã được hoàn tiền" }, { status: 400 });
      }
      if (order.paymentStatus !== "PAID") {
        return NextResponse.json({ error: "Đơn hàng chưa được thanh toán" }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: order.userId! },
          data: { balance: { increment: order.finalAmount } },
        });
        await tx.transaction.create({
          data: {
            userId: order.userId!,
            type: "REFUND",
            amount: order.finalAmount,
            description: `Hoàn tiền đơn hàng ${order.orderNumber}`,
            status: "SUCCESS",
          },
        });
        await tx.order.update({
          where: { id },
          data: { paymentStatus: "REFUNDED", status: "REFUNDED" },
        });

        const allKeys = order.items.flatMap((item) => item.productKeys);
        if (allKeys.length > 0) {
          const keyIds = allKeys.map((k) => k.id);
          await tx.productKey.updateMany({
            where: { id: { in: keyIds } },
            data: { status: "COMPROMISED" },
          });
        }

        await tx.auditLog.create({
          data: {
            userId: admin.id, action: "REFUND_ORDER", entity: "Order",
            entityId: id,
            details: JSON.stringify({ amount: order.finalAmount }),
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          },
        });
      });
      return NextResponse.json({ success: true, message: "Hoàn tiền thành công!" });
    }

    // Validate inputs for field updates
    const validStatuses = [
      "PENDING",
      "PROCESSING",
      "COMPLETED",
      "CANCELLED",
      "REFUNDED",
    ];
    const validPaymentStatuses = ["UNPAID", "PAID", "FAILED", "REFUNDED"];

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid order status" },
        { status: 400 },
      );
    }
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return NextResponse.json(
        { error: "Invalid payment status" },
        { status: 400 },
      );
    }
    const updateData: {
      status?:
        | "PENDING"
        | "PROCESSING"
        | "COMPLETED"
        | "CANCELLED"
        | "REFUNDED";
      paymentStatus?: "UNPAID" | "PAID" | "FAILED" | "REFUNDED";
      note?: string | null;
    } = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (note !== undefined) updateData.note = note;

    // Automatically set paymentStatus = PAID when status = COMPLETED
    if (status === "COMPLETED") {
      updateData.paymentStatus = "PAID";
    }

    // Execute normal update in transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const isCompleting =
        status === "COMPLETED" && order.status !== "COMPLETED";

      // If transitioning to COMPLETED, auto-assign keys if needed
      if (isCompleting) {
        const assignedKeysCountByProduct: Record<string, number> = {};
        const orderKeys = order.items.flatMap((i) => i.productKeys);
        for (const key of orderKeys) {
          assignedKeysCountByProduct[key.productId] =
            (assignedKeysCountByProduct[key.productId] || 0) + 1;
        }
        for (const item of order.items) {
          const currentlyAssigned = assignedKeysCountByProduct[item.productId] || 0;
          const neededQty = item.quantity - currentlyAssigned;

          if (neededQty > 0) {
            const availableKeys = await tx.productKey.findMany({
              where: { productId: item.productId, status: "AVAILABLE" },
              take: neededQty,
              orderBy: { createdAt: "asc" },
            });
            if (availableKeys.length < neededQty) {
              throw new Error(
                `Không đủ key trong kho cho sản phẩm "${item.product.name}". Còn thiếu ${neededQty - availableKeys.length} key.`,
              );
            }

            const keyIds = availableKeys.map((k) => k.id);
            await tx.productKey.updateMany({
              where: { id: { in: keyIds } },
              data: {
                status: "SOLD",
                orderItemId: item.id,
                soldAt: new Date(),
              },
            });

            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: neededQty } },
            });
          }
        }

        const downloadsCount = await tx.download.count({ where: { orderId: id } });
        if (downloadsCount === 0 && order.userId) {
          for (const item of order.items) {
            for (let i = 0; i < item.quantity; i++) {
              await tx.download.create({
                data: {
                  orderId: id,
                  userId: order.userId,
                  productKey: null,
                  downloadUrl: null,
                  maxDownloads: 5,
                },
              });
            }
          }
        }
      }

      // Perform update on the order
      const result = await tx.order.update({
        where: { id },
        data: updateData,
        include: {
          user: true,
          items: {
            include: {
              product: true,
              productKeys: true,
            },
          },
        },
      });

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: "UPDATE_ORDER",
          entity: "Order",
          entityId: id,
          details: JSON.stringify({
            updatedFields: Object.keys(updateData),
            previousValues: {
              status: order.status,
              paymentStatus: order.paymentStatus,
              note: order.note,
            },
            newValues: {
              status: result.status,
              paymentStatus: result.paymentStatus,
              note: result.note,
            },
          }),
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        },
      });
      return result;
    });
    return NextResponse.json({
      success: true,
      message: "Cập nhật đơn hàng thành công",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Update order error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      {
        status:
          error instanceof Error && error.message.includes("Không đủ key")
            ? 400
            : 500,
      },
    );
  }
}

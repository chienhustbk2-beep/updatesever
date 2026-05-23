import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Bạn cần đăng nhập để thực hiện thanh toán" },
        { status: 401 },
      );
    }
    const userId = session.user.id;
    const { id: orderId } = await params;
    const body = await request.json();
    const { paymentMethod = "BALANCE" } = body;

    // Tìm đơn hàng
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    if (!order) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng" },
        { status: 404 },
      );
    }

    // Kiểm tra đơn hàng thuộc về user
    if (order.userId !== userId) {
      return NextResponse.json(
        { error: "Bạn không có quyền thanh toán đơn hàng này" },
        { status: 403 },
      );
    }

    // Kiểm tra trạng thái đơn hàng
    if (order.status !== "PENDING" || order.paymentStatus !== "UNPAID") {
      return NextResponse.json(
        { error: "Đơn hàng này không thể thanh toán" },
        { status: 400 },
      );
    }

    // Chỉ hỗ trợ thanh toán bằng BALANCE
    if (paymentMethod !== "BALANCE") {
      return NextResponse.json(
        {
          error: "Chỉ hỗ trợ thanh toán bằng số dư cho đơn hàng chờ thanh toán",
        },
        { status: 400 },
      );
    }

    // Kiểm tra số dư
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Không tìm thấy tài khoản" },
        { status: 404 },
      );
    }
    if (user.balance < order.finalAmount) {
      return NextResponse.json(
        {
          error: "Số dư không đủ",
          currentBalance: user.balance,
          required: order.finalAmount,
        },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: order.finalAmount } },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: "PAYMENT",
          amount: -order.finalAmount,
          description: `Thanh toán đơn hàng ${order.orderNumber}`,
          status: "SUCCESS",
        },
      });

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "COMPLETED",
          paymentStatus: "PAID",
          paymentMethod: "BALANCE",
        },
      });

      for (const item of order.items) {
        const availableKeys = await tx.productKey.findMany({
          where: { productId: item.productId, status: "AVAILABLE" },
          take: item.quantity,
          orderBy: { createdAt: "asc" },
        });
        if (availableKeys.length < item.quantity) {
          throw new Error(
            `Không đủ số lượng sản phẩm "${item.product.name}" trong kho. Còn lại: ${availableKeys.length}, Cần: ${item.quantity}`,
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
          data: { stock: { decrement: item.quantity } },
        });
      }

      for (const item of order.items) {
        for (let i = 0; i < item.quantity; i++) {
          await tx.download.create({
            data: {
              orderId: orderId,
              userId,
              productKey: null,
              downloadUrl: null,
              maxDownloads: 5,
            },
          });
        }
      }

      const soldKeys = await tx.productKey.findMany({
        where: {
          orderItemId: { not: null },
          status: "SOLD",
          orderItem: { orderId: orderId },
        },
        include: {
          product: { select: { name: true } },
        },
      });
      return { order: updatedOrder, soldKeys };
    });
    return NextResponse.json(
      {
        success: true,
        message: "Thanh toán thành công! Key đã được giao.",
        order: {
          id: result.order.id,
          orderNumber: result.order.orderNumber,
          status: result.order.status,
          paymentStatus: result.order.paymentStatus,
        },
        keys: result.soldKeys.map((k) => ({
          productId: k.productId,
          productName: k.product.name,
          keyValue: k.keyValue,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Pay pending order error:", error);
    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage.includes("Không đủ số lượng")) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Có lỗi xảy ra trong quá trình thanh toán" },
      { status: 500 },
    );
  }
}

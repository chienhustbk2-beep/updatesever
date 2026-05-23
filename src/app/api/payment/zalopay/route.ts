import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import * as crypto from "crypto";

// ZaloPay configuration
const ZALOPAY_CONFIG = {
  appId: process.env.ZALOPAY_APP_ID || "2553",
  key1: process.env.ZALOPAY_KEY1 || "",
  key2: process.env.ZALOPAY_KEY2 || "",
  endpoint: "https://sb-openapi.zalopay.vn/v2/create",
  redirectUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
  callbackUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/payment/zalopay/callback`,
}
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (order.paymentMethod !== "ZALOPAY") {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 },
      );
    }
    if (order.paymentStatus === "PAID") {
      return NextResponse.json(
        { error: "Order already paid" },
        { status: 400 },
      );
    }

    // Create ZaloPay payment request
    const appTransId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const amount = Math.round(order.finalAmount);
    const embedData = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      redirectUrl: `${ZALOPAY_CONFIG.redirectUrl}/dashboard`,
    }
const items = [
      {
        itemId: "order",
        itemName: `Don hang ${order.orderNumber}`,
        itemPrice: amount,
        itemQuantity: 1,
      },
    ];

    const orderData = {
      app_id: ZALOPAY_CONFIG.appId,
      app_trans_id: appTransId,
      app_user: order.userId,
      app_time: Date.now(),
      amount: amount,
      description: `Thanh toan don hang ${order.orderNumber}`,
      item: JSON.stringify(items),
      embed_data: JSON.stringify(embedData),
      bank_code: "",
      callback_url: ZALOPAY_CONFIG.callbackUrl,
      return_url: ZALOPAY_CONFIG.redirectUrl,
    };

    // Generate MAC
    const macData = [
      orderData.app_id,
      orderData.app_trans_id,
      orderData.app_user,
      orderData.amount,
      orderData.app_time,
      orderData.embed_data,
      orderData.item,
    ].join("|");
    const mac = crypto
      .createHmac("sha256", ZALOPAY_CONFIG.key1)
      .update(macData)
      .digest("hex");
    const requestBody = {
      ...orderData,
      mac,
    };

    // Call ZaloPay API
    const response = await fetch(ZALOPAY_CONFIG.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    const zalopayResponse = await response.json();
    if (zalopayResponse.return_code === 1) {
      return NextResponse.json({
        success: true,
        orderUrl: zalopayResponse.order_url,
        orderId: order.id,
        orderNumber: order.orderNumber,
        appTransId,
      });
    }
    return NextResponse.json(
      {
        error:
          zalopayResponse.return_message || "Failed to create ZaloPay payment",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("ZaloPay payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Callback handler for ZaloPay
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, mac } = body;

    // Verify MAC
    const macData = [
      ZALOPAY_CONFIG.key2,
      data.app_id,
      data.app_trans_id,
      data.status,
    ].join("|");
    const expectedMac = crypto
      .createHmac("sha256", ZALOPAY_CONFIG.key2)
      .update(macData)
      .digest("hex");
    if (mac !== expectedMac) {
      return NextResponse.json(
        { return_code: 0, return_message: "Invalid MAC" },
        { status: 400 },
      );
    }

    // status = 1 means successful payment
    if (data.status === 1) {
      const embedData = JSON.parse(data.embed_data);
      await processPaymentSuccess(embedData.orderId, data.app_trans_id);
    }
    return NextResponse.json({ return_code: 1, return_message: "success" });
  } catch (error) {
    console.error("ZaloPay callback error:", error);
    return NextResponse.json(
      { return_code: 0, return_message: "error" },
      { status: 500 },
    );
  }
}
async function processPaymentSuccess(orderId: string, transactionId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.paymentStatus === "PAID") return;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "COMPLETED",
        paymentStatus: "PAID",
        transactionCode: transactionId,
      },
    });

    if (order.userId) {
      await tx.transaction.create({
        data: {
          userId: order.userId,
          type: "PAYMENT",
          amount: -order.finalAmount,
          description: `Thanh toán ZaloPay đơn hàng ${order.orderNumber}`,
          status: "SUCCESS",
        },
      });
    }

    for (const item of order.items) {
      const availableKeys = await tx.productKey.findMany({
        where: { productId: item.productId, status: "AVAILABLE" },
        take: item.quantity,
        orderBy: { createdAt: "asc" },
      });
      if (availableKeys.length < item.quantity) {
        throw new Error(`Not enough keys for product ${item.productId}`);
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

      if (order.userId) {
        for (let i = 0; i < item.quantity; i++) {
          await tx.download.create({
            data: {
              orderId: order.id,
              userId: order.userId,
              productKey: availableKeys[i]?.keyValue || null,
              downloadUrl: null,
              maxDownloads: 5,
            },
          });
        }
      }
    }
  });
}

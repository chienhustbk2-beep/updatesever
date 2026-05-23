import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import * as crypto from "crypto";

// MoMo payment configuration
const MOMO_CONFIG = {
  partnerCode: process.env.MOMO_PARTNER_CODE || "MOMO_PARTNER",
  accessKey: process.env.MOMO_ACCESS_KEY || "",
  secretKey: process.env.MOMO_SECRET_KEY || "",
  endpoint: "https://test-payment.momo.vn/v2/gateway/api/create",
  redirectUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
  ipnUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/payment/momo/ipn`,
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
    if (order.paymentMethod !== "MOMO") {
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

    // Create MoMo payment request
    const requestId = order.orderNumber;
    const amount = order.finalAmount;
    const orderIdMomo = order.orderNumber;
    const orderInfo = `Thanh toan don hang ${order.orderNumber}`;
    const extraData = order.id;

    // Generate signature
    const rawSignature = [
      `accessKey=${MOMO_CONFIG.accessKey}`,
      `amount=${amount}`,
      `extraData=${extraData}`,
      `ipnUrl=${MOMO_CONFIG.ipnUrl}`,
      `orderId=${orderIdMomo}`,
      `orderInfo=${orderInfo}`,
      `partnerCode=${MOMO_CONFIG.partnerCode}`,
      `redirectUrl=${MOMO_CONFIG.redirectUrl}/api/payment/momo/callback`,
      `requestId=${requestId}`,
      `requestType=payWithMethod`,
    ].join("&");
    const signature = crypto
      .createHmac("sha256", MOMO_CONFIG.secretKey)
      .update(rawSignature)
      .digest("hex");
    const requestBody = {
      partnerCode: MOMO_CONFIG.partnerCode,
      partnerName: "Software Key Shop",
      storeId: "STORE_001",
      requestId,
      amount: amount.toString(),
      orderId: orderIdMomo,
      orderInfo,
      redirectUrl: `${MOMO_CONFIG.redirectUrl}/api/payment/momo/callback`,
      ipnUrl: MOMO_CONFIG.ipnUrl,
      lang: "vi",
      requestType: "payWithMethod",
      autoCapture: true,
      extraData,
      signature,
    };

    // Call MoMo API
    const response = await fetch(MOMO_CONFIG.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    const momoResponse = await response.json();
    if (momoResponse.resultCode === 0) {
      return NextResponse.json({
        success: true,
        payUrl: momoResponse.payUrl,
        orderId: order.id,
        orderNumber: order.orderNumber,
      });
    }
    return NextResponse.json(
      { error: momoResponse.message || "Failed to create MoMo payment" },
      { status: 400 },
    );
  } catch (error) {
    console.error("MoMo payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// IPN (Instant Payment Notification) handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify signature
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = body;
    const rawSignature = [
      `accessKey=${MOMO_CONFIG.accessKey}`,
      `amount=${amount}`,
      `extraData=${extraData}`,
      `message=${message}`,
      `orderId=${orderId}`,
      `orderInfo=${orderInfo}`,
      `orderType=${orderType}`,
      `partnerCode=${partnerCode}`,
      `payType=${payType}`,
      `requestId=${requestId}`,
      `responseTime=${responseTime}`,
      `resultCode=${resultCode}`,
      `transId=${transId}`,
    ].join("&");
    const expectedSignature = crypto
      .createHmac("sha256", MOMO_CONFIG.secretKey)
      .update(rawSignature)
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // resultCode = 0 means successful payment
    if (resultCode === 0) {
      await processPaymentSuccess(extraData, transId);
    }
    return NextResponse.json({ result: 0, message: "success" });
  } catch (error) {
    console.error("MoMo IPN error:", error);
    return NextResponse.json({ result: 1, message: "error" }, { status: 500 });
  }
}

// Callback handler for redirect after payment
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const resultCode = searchParams.get("resultCode");

    if (!orderId || !resultCode) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 },
      );
    }
    if (resultCode === "0") {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });
      if (order && order.paymentStatus !== "PAID") {
        await processPaymentSuccess(orderId, `MOMO_${Date.now()}`);
      }
    }
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard`,
    );
  } catch (error) {
    console.error("MoMo callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard`,
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
          description: `Thanh toán MoMo đơn hàng ${order.orderNumber}`,
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

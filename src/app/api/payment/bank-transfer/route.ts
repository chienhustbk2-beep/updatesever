import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Bank transfer configuration
const BANK_CONFIG = {
  bankName: process.env.BANK_NAME || "Vietcombank",
  accountNumber: process.env.BANK_ACCOUNT_NUMBER || "0123456789",
  accountName: process.env.BANK_ACCOUNT_NAME || "CONG TY TNHH SOFTWARE KEY",
  qrTemplate:
    process.env.BANK_QR_TEMPLATE ||
    "https://img.vietqr.io/image/{bankCode}-{accountNumber}-compact2.png?amount={amount}&addInfo={content}",
  bankCode: process.env.BANK_CODE || "vietcombank",
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
    if (order.paymentMethod !== "BANK_TRANSFER") {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 },
      );
    }

    // Generate QR code URL
    const content = order.transactionCode || order.orderNumber;
    const qrCodeUrl = BANK_CONFIG.qrTemplate
      .replace("{bankCode}", BANK_CONFIG.bankCode)
      .replace("{accountNumber}", BANK_CONFIG.accountNumber)
      .replace("{amount}", order.finalAmount.toString())
      .replace("{content}", encodeURIComponent(content));

    return NextResponse.json({
      success: true,
      bankInfo: {
        bankName: BANK_CONFIG.bankName,
        accountNumber: BANK_CONFIG.accountNumber,
        accountName: BANK_CONFIG.accountName,
        amount: order.finalAmount,
        content: content,
        qrCodeUrl,
      },
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("Bank transfer info error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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

    // Lay cau hinh tu DB
    const settings = await prisma.systemSettings.findMany({
      where: { key: { in: ["bankName", "bankAccount", "bankAccountName", "bankCode"] } },
    });
    const s: Record<string, string> = {};
    settings.forEach((e) => { s[e.key] = e.value });
    const bankName = s.bankName || "Vietcombank";
    const accountNumber = s.bankAccount || "0123456789";
    const accountName = s.bankAccountName || "CONG TY TNHH SOFTWARE KEY";
    const bankCode = s.bankCode || "vietcombank";

    // Generate QR code URL
    const qrTemplate = "https://img.vietqr.io/image/{bankCode}-{accountNumber}-compact2.png?amount={amount}&addInfo={content}&accountName={accountName}";
    const content = order.transactionCode || order.orderNumber;
    const qrCodeUrl = qrTemplate
      .replace("{bankCode}", bankCode)
      .replace("{accountNumber}", accountNumber)
      .replace("{amount}", order.finalAmount.toString())
      .replace("{content}", encodeURIComponent(content))
      .replace("{accountName}", encodeURIComponent(accountName));

    return NextResponse.json({
      success: true,
      bankInfo: {
        bankName,
        accountNumber,
        accountName,
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

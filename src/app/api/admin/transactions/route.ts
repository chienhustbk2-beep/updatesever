import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin || (admin.role !== "ADMIN" && admin.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { description: { contains: search } },
      ];
    }
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await request.json();
    const { transactionId, action } = body;

    if (!transactionId || !action) {
      return NextResponse.json(
        { error: "Missing transactionId or action" },
        { status: 400 },
      );
    }
    const tx = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!tx) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }
    if (action === "approve") {
      const approveResult = await prisma.$transaction(async (prismaTx) => {
        // Đọc lại transaction bên trong transaction để tránh race condition:
        // nếu 2 request admin approve đồng thời, cả 2 sẽ thấy PENDING nếu
        // kiểm tra bên ngoài, dẫn đến cộng tiền 2 lần
        const txInner = await prismaTx.transaction.findUnique({
          where: { id: transactionId },
        });
        if (!txInner || txInner.status !== "PENDING") {
          return { success: false, error: "Transaction is not pending" };
        }

        await prismaTx.transaction.update({
          where: { id: transactionId },
          data: { status: "SUCCESS" },
        });
        await prismaTx.user.update({
          where: { id: txInner.userId },
          data: { balance: { increment: txInner.amount } },
        });

        await prismaTx.auditLog.create({
          data: {
            userId: admin.id,
            action: "APPROVE_DEPOSIT",
            entity: "Transaction",
            entityId: transactionId,
            details: JSON.stringify({ amount: txInner.amount, userId: txInner.userId }),
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          },
        });

        return { success: true, amount: txInner.amount, userId: txInner.userId };
      });

      if (!approveResult.success) {
        return NextResponse.json(
          { error: approveResult.error },
          { status: 400 },
        );
      }

      return NextResponse.json({ success: true, message: "Deposit approved" });
    }
    if (action === "reject") {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: "FAILED" },
      });
      return NextResponse.json({ success: true, message: "Deposit rejected" });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Update transaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail, depositSuccessTemplate } from "@/lib/mail";

/**
 * SEPAY WEBHOOK API
 * ==================
 * Endpoint: POST /api/webhook/sepay
 *
 * SePay sẽ gửi POST request đến endpoint này khi có giao dịch mới.
 * Webhook sẽ:
 * 1. Đọc nội dung chuyển khoản (content/message)
 * 2. Dùng Regex tìm pattern "NAP [userId]"
 * 3. Nếu tìm thấy userId hợp lệ:
 *    - Tạo record Transaction với status SUCCESS
 *    - Cộng tiền vào balance của user (Prisma Transaction)
 * 4. Trả về HTTP 200 OK
 *
 * Format request từ SePay (ví dụ):
 * {
 *   "amount": 50000,
 *   "content": "NAP abc123xyz",
 *   "accountNumber": "0123456789",
 *   "transactionDate": "2024-01-01T12:00:00",
 *   ...
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ==========================================
    // BƯỚC 1: Lấy thông tin từ webhook payload
    // ==========================================
    // SePay có thể gửi các field khác nhau tùy cấu hình
    // Các field phổ biến: amount, content, description, message
    const amount = body.amount || body.money || 0;
    const content = body.content || body.description || body.message || "";

    console.log("[SePay Webhook] Received:", { amount, content });

    if (!amount || amount <= 0) {
      console.error("[SePay Webhook] Invalid amount:", amount);
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!content) {
      console.error("[SePay Webhook] Empty content");
      return NextResponse.json({ error: "Empty content" }, { status: 400 });
    }

    // ==========================================
    // BƯỚC 2: Parse nội dung chuyển khoản
    // Dùng Regex tìm pattern: NAP [accountCode]
    // accountCode là mã 6 chữ số của user (VD: NAP 183942)
    // ==========================================
    const napRegex = /NAP\s+(\d{6})/i;
    const match = content.match(napRegex);

    if (!match) {
      console.log("[SePay Webhook] No NAP pattern found in content:", content);
      // Không phải giao dịch nạp tiền, trả về 200 để SePay không retry
      return NextResponse.json(
        { message: "Not a deposit transaction" },
        { status: 200 },
      );
    }
    const accountCode = match[1];
    console.log("[SePay Webhook] Parsed accountCode:", accountCode, "amount:", amount);

    // ==========================================
    // BƯỚC 3: Kiểm tra user tồn tại qua accountCode
    // ==========================================
    const user = await prisma.user.findUnique({
      where: { accountCode },
    });
    if (!user) {
      console.error("[SePay Webhook] User not found for accountCode:", accountCode);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const userId = user.id;

    // ==========================================
    // BƯỚC 4: PRISMA TRANSACTION - Atomic Operation
    // Hoặc thành công TẤT CẢ, hoặc hủy TẤT CẢ
    // Bao gồm kiểm tra idempotency để chống xử lý trùng
    // ==========================================
    const result = await prisma.$transaction(async (tx) => {
      // 4.0: Kiểm tra idempotency - nếu giao dịch với nội dung này
      // đã được xử lý thành công rồi thì bỏ qua (chống SePay retry)
      const existingTx = await tx.transaction.findFirst({
        where: {
          userId,
          type: "DEPOSIT",
          amount,
          description: {
            contains: content,
          },
          status: "SUCCESS",
        },
      });
      if (existingTx) {
        console.log("[SePay Webhook] Duplicate webhook detected, skipping:", {
          userId,
          amount,
          content,
          existingTxId: existingTx.id,
        });
        return {
          transaction: existingTx,
          newBalance: (await tx.user.findUnique({
            where: { id: userId },
            select: { balance: true },
          }))!.balance,
          alreadyProcessed: true,
        };
      }

      // 4.1: Tạo record Transaction với status SUCCESS
      // 4.1: Tạo record Transaction với type DEPOSIT
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: "DEPOSIT",
          amount,
          description: `Nạp tiền từ VietQR - ${content}`,
          status: "SUCCESS",
        },
      });

      // 4.2: Cộng tiền vào balance của user
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          balance: {
            increment: amount,
          },
        },
      });
      return {
        transaction,
        newBalance: updatedUser.balance,
        alreadyProcessed: false,
      };
    });

    console.log("[SePay Webhook] Success:", {
      userId,
      amount,
      newBalance: result.newBalance,
      transactionId: result.transaction.id,
      alreadyProcessed: result.alreadyProcessed,
    });

    // 4.3: G?i email th�ng b�o n?u l� giao d?ch m?i
    if (!result.alreadyProcessed && user.email) {
      const txShortId = result.transaction.id.substring(0, 8).toUpperCase();
      sendMail({
        to: user.email,
        subject: `N?p ti?n th�nh c�ng - ${txShortId}`,
        html: depositSuccessTemplate({
          userName: user.name || user.email,
          amount: amount.toLocaleString("vi-VN"),
          transactionCode: txShortId,
          newBalance: result.newBalance.toLocaleString("vi-VN"),
          depositMethod: "VietQR (SePay)",
          email: user.email,
        }),
      });
    }

    // ==========================================
    // BU?C 5: Tr? v? 200 OK - SePay bi?t da nh?n th�nh c�ng
    // ==========================================
    return NextResponse.json(
      {
        success: true,
        message: result.alreadyProcessed
          ? "Duplicate webhook, already processed"
          : "Deposit processed successfully",
        data: {
          userId,
          amount,
          newBalance: result.newBalance,
          transactionId: result.transaction.id,
          alreadyProcessed: result.alreadyProcessed,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[SePay Webhook] Error:", error);

    // Trả về 500 để SePay biết cần retry
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// SePay có thể gửi GET request để kiểm tra endpoint
export async function GET() {
  return NextResponse.json(
    { message: "SePay webhook endpoint is active" },
    { status: 200 },
  );
}

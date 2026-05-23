import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail, depositSuccessTemplate } from "@/lib/mail";

/**
 * WEB2M SYNC API
 * ===============
 * Endpoint: GET /api/web2m/sync?secret=YOUR_CRON_SECRET
 *
 * Goi dinh ky (cron job) de dong bo giao dich tu Web2M ve he thong.
 * Yeu cau tham so `secret` de bao ve endpoint khoi truy cap trai phep.
 *
 * Web2M API format (du kien):
 *   GET {endpoint}/history?token={apiToken}
 * Response:
 *   { "status": "success", "data": [{ "transaction_id": "...", "amount": 50000, "content": "NAP user123", ... }] }
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cronSecret = searchParams.get("secret");

    // Basic protection: yeu cau secret
    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Lay cau hinh Web2M tu DB
    const settings = await prisma.systemSettings.findMany({
      where: { key: { in: ["web2mApiToken", "web2mEndpoint", "activePaymentGateway"] } },
    });
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => { settingsMap[s.key] = s.value });

    const apiToken = settingsMap.web2mApiToken;
    const endpoint = settingsMap.web2mEndpoint || "https://api.web2m.com";

    if (!apiToken) {
      return NextResponse.json(
        { error: "Web2M API Token chua duoc cau hinh" },
        { status: 400 },
      );
    }

    // Goi API Web2M lay danh sach giao dich
    const web2mUrl = `${endpoint}/history?token=${apiToken}`;
    console.log("[Web2M Sync] Fetching transactions from Web2M");

    const response = await fetch(web2mUrl, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.error("[Web2M Sync] API error:", response.status);
      return NextResponse.json(
        { error: `Web2M API tra ve loi HTTP ${response.status}` },
        { status: 502 },
      );
    }

    const rawData = await response.json();

    // Chuan hoa du lieu dau vao (ho tro nhieu format API)
    const transactions = Array.isArray(rawData)
      ? rawData
      : rawData.data
        ? (Array.isArray(rawData.data) ? rawData.data : [rawData.data])
        : rawData.transactions
          ? (Array.isArray(rawData.transactions) ? rawData.transactions : [rawData.transactions])
          : [];

    if (transactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Khong co giao dich moi tu Web2M",
        processed: 0,
        skipped: 0,
      });
    }

    // Xu ly tung giao dich voi co che idempotency
    let processed = 0;
    let skipped = 0;
    const results: { transactionId: string; userId: string; amount: number; status: string }[] = [];

    for (const tx of transactions) {
      const amount = parseFloat(tx.amount || tx.money || tx.price || 0);
      const content = (tx.content || tx.description || tx.message || "").trim();
      const providerTxId = tx.transaction_id || tx.id || tx.code || tx.txnId || "";

      if (!amount || amount <= 0 || !content) {
        skipped++;
        continue;
      }

      // Parse noi dung: NAP [userId] hoac NAP [accountCode]
      const napMatch = content.match(/NAP\s+(\S+)/i);
      if (!napMatch) {
        skipped++;
        continue;
      }
      const identifier = napMatch[1];

      // Tim user theo userId truoc, sau do accountCode
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: identifier },
            { accountCode: identifier },
          ],
        },
      });
      if (!user) {
        console.log("[Web2M Sync] User not found for identifier:", identifier);
        skipped++;
        continue;
      }

      // Xu ly trong transaction voi idempotency check
      const result = await prisma.$transaction(async (txDb) => {
        // Idempotency: kiem tra transaction da xu ly qua providerTxId hoac noi dung
        const existingById = providerTxId
          ? await txDb.transaction.findFirst({
              where: { description: { contains: providerTxId } },
            })
          : null;

        if (existingById) {
          return { status: "skipped" as const };
        }

        const existingByContent = await txDb.transaction.findFirst({
          where: {
            userId: user.id,
            type: "DEPOSIT",
            amount,
            description: { contains: content },
            status: "SUCCESS",
          },
        });

        if (existingByContent) {
          return { status: "skipped" as const };
        }

        // Tao transaction + cong tien
        await txDb.transaction.create({
          data: {
            userId: user.id,
            type: "DEPOSIT",
            amount,
            description: `Nap tien tu Web2M - ${content}${providerTxId ? ` (${providerTxId})` : ""}`,
            status: "SUCCESS",
          },
        });

        await txDb.user.update({
          where: { id: user.id },
          data: { balance: { increment: amount } },
        });

        return { status: "processed" as const };
      });

      if (result.status === "processed") {
        processed++;
        results.push({ transactionId: providerTxId, userId: user.id, amount, status: "SUCCESS" });
        // Gui email thong bao neu user co email
        if (user.email) {
          const updatedUser = await prisma.user.findUnique({ where: { id: user.id }, select: { balance: true } });
          const txShortId = (providerTxId || "").substring(0, 8).toUpperCase() || `TXN${Date.now().toString(36).toUpperCase()}`;
          sendMail({
            to: user.email,
            subject: `Nap tien thanh cong - ${txShortId}`,
            html: depositSuccessTemplate({
              userName: user.name || user.email,
              amount: amount.toLocaleString("vi-VN"),
              transactionCode: txShortId,
              newBalance: (updatedUser?.balance || 0).toLocaleString("vi-VN"),
              depositMethod: "Web2M",
              email: user.email,
            }),
          });
        }
      } else {
        skipped++;
      }
    }

    console.log("[Web2M Sync] Completed:", { processed, skipped });

    return NextResponse.json({
      success: true,
      message: `Dong bo Web2M hoan tat: ${processed} giao dich duoc xu ly, ${skipped} giao dich bi bo qua`,
      data: { processed, skipped, results },
    });
  } catch (error) {
    console.error("[Web2M Sync] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

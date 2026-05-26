import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail, depositSuccessTemplate } from "@/lib/mail";

export async function GET(request: NextRequest) {
  try {
    // 1. Lay cau hinh tu DB
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: { in: ["bankCode", "bankAccount", "web2mBankPassword", "web2mApiToken", "web2mEndpoint", "depositPrefix", "deposit_bonus_rules"] },
      },
    });
    const s: Record<string, string> = {};
    settings.forEach((e) => { s[e.key] = e.value });

    const bankCode = s.bankCode || "";
    const bankAccount = s.bankAccount || "";
    const web2mPassword = s.web2mBankPassword || "";
    const web2mToken = s.web2mApiToken || "";
    const depositPrefix = s.depositPrefix || "MMO";

    const missing = [];
    if (!bankCode) missing.push("bankCode");
    if (!bankAccount) missing.push("bankAccount");
    if (!web2mPassword) missing.push("web2mBankPassword");
    if (!web2mToken) missing.push("web2mApiToken");
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Thieu cau hinh Web2M: ${missing.join(", ")}` },
        { status: 400 },
      );
    }

    const VALID_BANK_CODES = [
      "vcb", "bidv", "vtb", "tcb", "mb", "acb", "hdb", "vp",
      "tpb", "vib", "msb", "sacombank", "shb", "ocb", "lpb",
      "nab", "ssb", "cbb", "abb", "bvb", "dab", "eab", "gpb",
      "hvb", "kvb", "nav", "pvb", "scb", "seab", "stb",
    ];
    const normalizedBankCode = bankCode.trim().toLowerCase();
    if (!VALID_BANK_CODES.includes(normalizedBankCode)) {
      return NextResponse.json(
        { error: `Bank Code "${bankCode}" khong hop le. Cac ma ho tro: ${VALID_BANK_CODES.join(", ")}` },
        { status: 400 },
      );
    }

    // 2. Dung endpoint tu settings (hoac tu dong ghep neu chua co)
    const baseUrl = s.web2mEndpoint || `https://api.web2m.com/historyapi${normalizedBankCode}v3`;
    const fullApiUrl = `${baseUrl}/${encodeURIComponent(web2mPassword)}/${encodeURIComponent(bankAccount)}/${encodeURIComponent(web2mToken)}`;
    console.log("[Web2M Sync] Fetching:", fullApiUrl.replace(web2mPassword, "***"));

    const response = await fetch(fullApiUrl, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.error("[Web2M Sync] HTTP error:", response.status);
      return NextResponse.json(
        { error: `Web2M API tra ve loi HTTP ${response.status}` },
        { status: 502 },
      );
    }

    const data = await response.json();

    // 3. Kiem tra cau truc JSON chuan Web2M V3
    if (!(data.status === true && Array.isArray(data.transactions))) {
      return NextResponse.json({
        success: true,
        message: "Khong co giao dich moi tu Web2M hoac sai dinh dang JSON",
        processed: 0,
        skipped: 0,
      });
    }

    // 4. Chi loc giao dich loai IN (tien nap vao)
    const inTransactions = data.transactions.filter(
      (tx: { type?: string }) => tx.type === "IN",
    );

    if (inTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Khong co giao dich nap tien (type=IN) tu Web2M",
        processed: 0,
        skipped: 0,
      });
    }

    // 5. Xu ly tung giao dich
    let processed = 0;
    let skipped = 0;
    const results: { transactionId: string; userId: string; amount: number; status: string }[] = [];

    for (const tx of inTransactions) {
      const amount = parseFloat(tx.amount || "0");
      const content = (tx.description || "").trim();
      const providerTxId = String(tx.transactionID || tx.transaction_id || tx.id || tx.code || "");

      if (!amount || amount <= 0 || !content || !providerTxId) {
        skipped++;
        continue;
      }

      // Parse noi dung nap tien: {prefix} [userId]
      const prefixEscaped = depositPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const napMatch = content.match(new RegExp(`${prefixEscaped}\\s+(\\S+)`, "i"));
      if (!napMatch) {
        skipped++;
        continue;
      }
      const identifier = napMatch[1];

      // Tim user
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: identifier },
            { accountCode: identifier },
          ],
        },
      });
      if (!user) {
        console.log("[Web2M Sync] User not found:", identifier);
        skipped++;
        continue;
      }

      // Xu ly trong transaction voi idempotency check
      const result = await prisma.$transaction(async (txDb) => {
        // Kiem tra transactionID da xu ly chua
        const existing = providerTxId
          ? await txDb.transaction.findFirst({
              where: { description: { contains: providerTxId } },
            })
          : null;

        if (existing) {
          return { status: "skipped" as const };
        }

        // Tao transaction + cong tien
        await txDb.transaction.create({
          data: {
            userId: user.id,
            type: "DEPOSIT",
            amount,
            description: `Nap tien tu Web2M - ${content} (${providerTxId})`,
            status: "SUCCESS",
          },
        });

        await txDb.user.update({
          where: { id: user.id },
          data: { balance: { increment: amount } },
        });

        // Apply deposit bonus
        let bonusAmount = 0;
        try {
          const bonusRules = JSON.parse(s.deposit_bonus_rules || '[]');
          if (Array.isArray(bonusRules) && bonusRules.length > 0) {
            const sorted = bonusRules
              .filter((r: { minAmount: number; bonus: number }) => r.minAmount > 0 && r.bonus > 0)
              .sort((a: { minAmount: number }, b: { minAmount: number }) => b.minAmount - a.minAmount);
            const matched = sorted.find((r: { minAmount: number }) => amount >= r.minAmount);
            if (matched) {
              bonusAmount = matched.bonus;
              await txDb.transaction.create({
                data: {
                  userId: user.id,
                  type: "DEPOSIT",
                  amount: bonusAmount,
                  description: `Thưởng nạp tiền: ${matched.label || `Nạp từ ${matched.minAmount.toLocaleString("vi-VN")}đ`} (${providerTxId})`,
                  status: "SUCCESS",
                },
              });
              await txDb.user.update({
                where: { id: user.id },
                data: { balance: { increment: bonusAmount } },
              });
            }
          }
        } catch {}

        return { status: "processed" as const };
      });

      if (result.status === "processed") {
        processed++;
        results.push({ transactionId: providerTxId, userId: user.id, amount, status: "SUCCESS" });

        // Gui email
        if (user.email) {
          const updatedUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { balance: true },
          });

          const txShortId = (providerTxId || "").substring(0, 8).toUpperCase();

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

    console.log("[Web2M Sync] Done:", { processed, skipped });

    return NextResponse.json({
      success: true,
      message: `Dong bo Web2M hoan tat: ${processed} giao dich duoc xu ly, ${skipped} giao dich bi bo qua`,
      data: { processed, skipped, results },
    });
  } catch (error) {
    console.error("[Web2M Sync] Error:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 },
    );
  }
}

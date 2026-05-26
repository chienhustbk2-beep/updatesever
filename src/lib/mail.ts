import nodemailer from "nodemailer";
import { prisma } from "./prisma";

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

async function getSmtpConfig() {
  const settings = await prisma.systemSettings.findMany({
    where: {
      key: { in: ["smtpHost", "smtpPort", "smtpUser", "smtpPassword", "smtpFromEmail"] },
    },
  });

  const config: Record<string, string> = {};
  settings.forEach((s) => { config[s.key] = s.value });

  return {
    host: config.smtpHost || "",
    port: parseInt(config.smtpPort || "587"),
    user: config.smtpUser || "",
    pass: config.smtpPassword || "",
    from: config.smtpFromEmail || config.smtpUser || "",
  };
}

export async function sendMail(options: MailOptions): Promise<boolean> {
  try {
    const smtp = await getSmtpConfig();

    if (!smtp.host || !smtp.user || !smtp.pass) {
      console.log("[Mail] SMTP chua duoc cau hinh, bo qua gui email");
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: { user: smtp.user, pass: smtp.pass },
    });

    await transporter.sendMail({
      from: `"${smtp.from}" <${smtp.user}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log("[Mail] Da gui email thanh cong den:", options.to);
    return true;
  } catch (error) {
    console.error("[Mail] Loi gui email:", error);
    return false;
  }
}

const APP_NAME = "ChienHust Store";

export function orderConfirmationTemplate(params: {
  userName: string;
  orderNumber: string;
  amount: string;
  items: { name: string; quantity: number; price: string }[];
  email: string;
}): string {
  const itemsHtml = params.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;font-size:13px;color:#52525b">${i.name} x${i.quantity}</td><td style="padding:8px 0;font-size:13px;color:#1a1a2e;text-align:right">${i.price} VND</td></tr>`,
    )
    .join("");
  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Don hang thanh cong</title></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px 40px;text-align:center">
            <h1 style="color:#ffffff;font-size:24px;margin:0;font-weight:700">${APP_NAME}</h1>
            <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0">Xac nhan don hang thanh cong</p>
          </td>
        </tr>
        <tr><td style="padding:32px 40px">
          <p style="font-size:15px;color:#1a1a2e;margin:0 0 20px">Xin chao <strong>${params.userName}</strong>,</p>
          <p style="font-size:14px;color:#52525b;margin:0 0 24px">Don hang <strong>${params.orderNumber}</strong> cua ban da duoc thanh toan va xu ly thanh cong. San pham da duoc giao ngay trong tai khoan.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px">
            <tr><td style="padding:8px 0;font-size:13px;color:#71717a">Ma don hang</td><td style="padding:8px 0;font-size:14px;font-weight:600;color:#1a1a2e;text-align:right;font-family:monospace">${params.orderNumber}</td></tr>
            ${itemsHtml}
            <tr><td style="padding:8px 0;font-size:13px;color:#71717a;border-top:1px solid #e4e4e7">Tong thanh toan</td><td style="padding:8px 0;font-size:16px;font-weight:700;color:#16a34a;text-align:right;border-top:1px solid #e4e4e7">${params.amount} VND</td></tr>
          </table>
          <p style="font-size:13px;color:#52525b;margin:0">Ban co the xem chi tiet don hang trong <a href="${process.env.NEXTAUTH_URL || ""}/dashboard" style="color:#155dfc;text-decoration:none;font-weight:500">bang dieu khien</a>.</p>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #e4e4e7;text-align:center">
          <p style="font-size:12px;color:#a1a1aa;margin:0">Email nay duoc gui tu he thong ${APP_NAME}. Vui long khong reply.</p>
          <p style="font-size:12px;color:#a1a1aa;margin:4px 0 0">Can ho tro? Lien he qua Zalo hoac Telegram tren website.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function depositSuccessTemplate(params: {
  userName: string;
  amount: string;
  transactionCode: string;
  newBalance: string;
  depositMethod: string;
  email: string;
}): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Nap tien thanh cong</title></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#155dfc,#0a3bb5);padding:32px 40px;text-align:center">
            <h1 style="color:#ffffff;font-size:24px;margin:0;font-weight:700">${APP_NAME}</h1>
            <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0">Xac nhan nap tien thanh cong</p>
          </td>
        </tr>
        <tr><td style="padding:32px 40px">
          <p style="font-size:15px;color:#1a1a2e;margin:0 0 20px">Xin chao <strong>${params.userName}</strong>,</p>
          <p style="font-size:14px;color:#52525b;margin:0 0 24px">Tai khoan cua ban vua duoc nap tien thanh cong qua <strong>${params.depositMethod}</strong>. Chi tiet giao dich:</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px">
            <tr><td style="padding:8px 0;font-size:13px;color:#71717a">So tien nap</td><td style="padding:8px 0;font-size:16px;font-weight:700;color:#155dfc;text-align:right">${params.amount} VND</td></tr>
            <tr><td style="padding:8px 0;font-size:13px;color:#71717a;border-top:1px solid #e4e4e7">Ma giao dich</td><td style="padding:8px 0;font-size:14px;font-weight:600;color:#1a1a2e;text-align:right;border-top:1px solid #e4e4e7;font-family:monospace">${params.transactionCode}</td></tr>
            <tr><td style="padding:8px 0;font-size:13px;color:#71717a;border-top:1px solid #e4e4e7">So du hien tai</td><td style="padding:8px 0;font-size:16px;font-weight:700;color:#16a34a;text-align:right;border-top:1px solid #e4e4e7">${params.newBalance} VND</td></tr>
          </table>
          <p style="font-size:13px;color:#52525b;margin:0">Ban co the kiem tra so du va lich su giao dich trong <a href="${process.env.NEXTAUTH_URL || ""}/dashboard" style="color:#155dfc;text-decoration:none;font-weight:500">bang dieu khien</a>.</p>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #e4e4e7;text-align:center">
          <p style="font-size:12px;color:#a1a1aa;margin:0">Email nay duoc gui tu he thong ${APP_NAME}. Vui long khong reply.</p>
          <p style="font-size:12px;color:#a1a1aa;margin:4px 0 0">Can ho tro? Lien he qua Zalo hoac Telegram tren website.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}


import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { validateCaptchaToken } from "@/lib/captcha-validate";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: toi da 3 lan dang ky / phut / IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = rateLimit({ key: getRateLimitKey(ip, "register"), maxAttempts: 3, windowMs: 60000 });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Qua nhieu yeu cau dang ky. Vui long thu lai sau." },
        { status: 429 },
      );
    }

    // Gioi han so tai khoan toi da / IP (toi da 5 account / gio)
    const accountRl = rateLimit({ key: getRateLimitKey(ip, "register-account"), maxAttempts: 5, windowMs: 3600000 });
    if (!accountRl.success) {
      return NextResponse.json(
        { error: "IP cua ban da tao qua nhieu tai khoan. Vui long thu lai sau." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Du lieu khong hop le" },
        { status: 400 },
      );
    }

    const { email, password, name, captchaToken } = parsed.data;

    const captchaResult = await validateCaptchaToken(captchaToken);
    if (!captchaResult.valid) {
      return NextResponse.json(
        { error: captchaResult.error || "Xac thuc captcha that bai" },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email đã được đăng ký" },
        { status: 400 },
      );
    }
    const passwordHash = await hash(password, 12);

    // Generate unique 6-digit accountCode
    let accountCode: string;
    let isUnique = false;
    do {
      accountCode = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await prisma.user.findUnique({ where: { accountCode } });
      if (!existing) isUnique = true;
    } while (!isUnique);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
        accountCode,
        balance: 0,
      },
    });
    return NextResponse.json(
      {
        success: true,
        message: "Đăng ký thành công",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi đăng ký" },
      { status: 500 },
    );
  }
}

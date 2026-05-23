import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email và mật khẩu là bắt buộc" },
        { status: 400 },
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu phải có ít nhất 6 ký tự" },
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

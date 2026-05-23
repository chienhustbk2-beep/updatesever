import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { code, total } = body;

    if (!code) {
      return NextResponse.json({ error: "Mã coupon là bắt buộc" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!coupon) {
      return NextResponse.json({ error: "Mã coupon không hợp lệ" }, { status: 400 });
    }
    if (!coupon.isActive) {
      return NextResponse.json({ error: "Mã coupon đã hết hạn" }, { status: 400 });
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return NextResponse.json({ error: "Mã coupon đã hết hạn sử dụng" }, { status: 400 });
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Mã coupon đã hết lượt sử dụng" }, { status: 400 });
    }
    if (coupon.minOrderAmount && total < coupon.minOrderAmount) {
      return NextResponse.json({
        error: `Đơn hàng tối thiểu ${coupon.minOrderAmount.toLocaleString("vi-VN")}đ`,
      }, { status: 400 });
    }

    if (session?.user?.id) {
      const alreadyUsed = await prisma.userCoupon.findUnique({
        where: { userId_couponId: { userId: session.user.id, couponId: coupon.id } },
      });
      if (alreadyUsed) {
        return NextResponse.json({ error: "Bạn đã sử dụng mã này rồi" }, { status: 400 });
      }
    }

    return NextResponse.json({
      coupon: { code: coupon.code, discount: coupon.value, type: coupon.type },
    });
  } catch (error) {
    console.error("Validate coupon error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, rating, comment } = body;

    if (!productId || !rating) {
      return NextResponse.json({ error: "Thiếu thông tin đánh giá" }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Đánh giá từ 1-5 sao" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Sản phẩm không tồn tại" }, { status: 404 });
    }

    const existingReview = await prisma.review.findUnique({
      where: { userId_productId: { userId: session.user.id, productId } },
    });
    if (existingReview) {
      return NextResponse.json({ error: "Bạn đã đánh giá sản phẩm này rồi" }, { status: 400 });
    }

    const hasCompletedOrder = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        items: { some: { productId } },
      },
    });
    if (!hasCompletedOrder) {
      return NextResponse.json({
        error: "Bạn cần mua sản phẩm và nhận hàng thành công mới được đánh giá",
      }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        productId,
        rating,
        comment: comment || null,
      },
      include: {
        user: { select: { name: true, avatar: true } },
      },
    });

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    const where = productId ? { productId } : {};
    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: { select: { name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

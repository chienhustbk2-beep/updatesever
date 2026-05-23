import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Kiểm tra admin
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Nhận dữ liệu từ request
    const body = await request.json();
    const { productId, keys } = body;
    if (!productId || !keys || !Array.isArray(keys)) {
      return NextResponse.json(
        { error: "productId và mảng keys là bắt buộc" },
        { status: 400 },
      );
    }

    // Kiểm tra sản phẩm tồn tại
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return NextResponse.json(
        { error: "Sản phẩm không tồn tại" },
        { status: 404 },
      );
    }

    // Lọc key trùng lặp trong input và loại bỏ key trống
    const uniqueKeys = [
      ...new Set(
        keys.map((k: string) => k.trim()).filter((k: string) => k.length > 0),
      ),
    ];
    if (uniqueKeys.length === 0) {
      return NextResponse.json(
        { error: "Không có key hợp lệ nào để import" },
        { status: 400 },
      );
    }

    // Kiểm tra key đã tồn tại trong hệ thống chưa
    const existingKeys = await prisma.productKey.findMany({
      where: {
        keyValue: {
          in: uniqueKeys,
        },
      },
      select: { keyValue: true },
    });
    const existingKeyValues = new Set(existingKeys.map((k) => k.keyValue));
    const newKeys = uniqueKeys.filter((k: string) => !existingKeyValues.has(k));
    if (newKeys.length === 0) {
      return NextResponse.json(
        { error: "Tất cả key đã tồn tại trong hệ thống" },
        { status: 400 },
      );
    }

    // Sử dụng createMany để import hàng loạt cùng lúc
    const result = await prisma.productKey.createMany({
      data: newKeys.map((keyValue: string) => ({
        productId,
        keyValue,
        status: "AVAILABLE",
      })),
    });

    // Cập nhật stock cho product
    await prisma.product.update({
      where: { id: productId },
      data: {
        stock: {
          increment: result.count,
        },
      },
    });
    return NextResponse.json(
      {
        success: true,
        importedCount: result.count,
        skippedCount: newKeys.length - result.count,
        alreadyExistedCount: existingKeys.length,
        message: `Import thành công ${result.count} key mới`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Import keys error:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi import key" },
      { status: 500 },
    );
  }
}

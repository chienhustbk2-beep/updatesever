import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await request.json();
    const { name, slug, description, icon, parentId } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Tên và slug là bắt buộc" },
        { status: 400 },
      );
    }
    const existing = await prisma.category.findFirst({
      where: { OR: [{ name }, { slug }] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Tên hoặc slug đã tồn tại" },
        { status: 400 },
      );
    }
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        icon: icon || null,
        parentId: parentId || null,
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "CREATE_CATEGORY",
        entity: "Category",
        entityId: category.id,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });
    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi tạo danh mục" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await checkAdmin();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { id } = await params;
    const body = await request.json();
    const category = await prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      return NextResponse.json(
        { error: "Danh mục không tồn tại" },
        { status: 404 },
      );
    }
    if (body.name && body.name !== category.name) {
      const existing = await prisma.category.findUnique({
        where: { name: body.name },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Tên danh mục đã tồn tại" },
          { status: 400 },
        );
      }
    }
    if (body.slug && body.slug !== category.slug) {
      const existing = await prisma.category.findUnique({
        where: { slug: body.slug },
      });
      if (existing) {
        return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 400 });
      }
    }
    if (body.parentId && body.parentId === id) {
      return NextResponse.json(
        { error: "Danh mục không thể làm cha của chính nó" },
        { status: 400 },
      );
    }
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.parentId !== undefined)
      updateData.parentId = body.parentId || null;

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
    });
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "UPDATE_CATEGORY",
        entity: "Category",
        entityId: id,
        details: JSON.stringify({ fields: Object.keys(updateData) }),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });
    return NextResponse.json({ success: true, category: updated });
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi cập nhật danh mục" },
      { status: 500 },
    );
  }
}
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await checkAdmin();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { children: true } } },
    });
    if (!category) {
      return NextResponse.json(
        { error: "Danh mục không tồn tại" },
        { status: 404 },
      );
    }
    const activeProductCount = await prisma.product.count({
      where: { categoryId: id, NOT: { slug: { startsWith: "deleted-" } } },
    });
    if (activeProductCount > 0) {
      return NextResponse.json(
        { error: "Không thể xóa danh mục có chứa sản phẩm" },
        { status: 400 },
      );
    }
    if (category._count.children > 0) {
      return NextResponse.json(
        { error: "Không thể xóa danh mục có danh mục con" },
        { status: 400 },
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "DELETE_CATEGORY",
        entity: "Category",
        entityId: id,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi xóa danh mục" },
      { status: 500 },
    );
  }
}

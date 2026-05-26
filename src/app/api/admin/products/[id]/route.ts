import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await checkAdmin();
    if (!admin || (admin.role !== "ADMIN" && admin.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { name: true } },
        _count: { select: { productKeys: true } },
      },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const [availableKeys, soldKeys] = await Promise.all([
      prisma.productKey.count({ where: { productId: id, status: "AVAILABLE" } }),
      prisma.productKey.count({ where: { productId: id, status: "SOLD" } }),
    ]);
    return NextResponse.json({
      product: {
        ...product,
        availableKeys,
        soldKeys,
        keyCount: product._count.productKeys,
      },
    });
  } catch (error) {
    console.error("Get product error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export async function POST(
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
    const { action } = body;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { productKeys: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (action === "duplicate") {
      const newSlug = `${product.slug}-copy-${Date.now()}`;

      const newProduct = await prisma.product.create({
        data: {
          name: `${product.name} (Copy)`,
          slug: newSlug,
          description: product.description,
          shortDesc: product.shortDesc,
          price: product.price,
          salePrice: product.salePrice,
          stock: product.stock,
          sku: product.sku ? `${product.sku}-COPY` : null,
          type: product.type,
          status: "DRAFT",
          images: product.images,
          categoryId: product.categoryId,
        },
      });
      await prisma.auditLog.create({
        data: {
          userId: admin.id,
          action: "DUPLICATE_PRODUCT",
          entity: "Product",
          entityId: id,
          details: JSON.stringify({ newProductId: newProduct.id }),
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        },
      });
      return NextResponse.json({ success: true, product: newProduct });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Product action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
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
    const product = await prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) {
      const existing = await prisma.product.findUnique({
        where: { slug: body.slug },
      });
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: "Slug already exists" },
          { status: 400 },
        );
      }
      updateData.slug = body.slug;
    }
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.guide !== undefined) updateData.guide = body.guide || null;
    if (body.shortDesc !== undefined) updateData.shortDesc = body.shortDesc;
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.salePrice !== undefined)
      updateData.salePrice = body.salePrice ? parseFloat(body.salePrice) : null;
    if (body.stock !== undefined) updateData.stock = parseInt(body.stock);
    if (body.sku !== undefined) updateData.sku = body.sku || null;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.images !== undefined) updateData.images = body.images.startsWith('[') ? body.images : JSON.stringify([body.images]);
    if (body.categoryId !== undefined)
      updateData.categoryId = body.categoryId || null;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    });
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "UPDATE_PRODUCT",
        entity: "Product",
        entityId: id,
        details: JSON.stringify({ fields: Object.keys(updateData) }),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });
    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
    const { searchParams } = new URL(request.url);
    const isConfirmed = searchParams.get("confirmed") === "true";

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        stock: true,
        type: true,
        _count: { select: { productKeys: true } },
      },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const availableKeyCount = await prisma.productKey.count({
      where: { productId: id, status: "AVAILABLE" },
    });

    const isKeyBased = product.type === "SOFTWARE_KEY" || product.type === "LICENSE_KEY" || product.type === "SUBSCRIPTION";

    if ((isKeyBased ? availableKeyCount : product.stock) > 0 && !isConfirmed) {
      const detail = isKeyBased
        ? `còn ${availableKeyCount} key chưa bán`
        : `tồn kho còn ${product.stock}`;
      return NextResponse.json({
        confirmRequired: true,
        availableKeys: availableKeyCount,
        totalKeys: product._count.productKeys,
        stock: product.stock,
        type: product.type,
        message: `Sản phẩm "${product.name}" ${detail}. Xoá sẽ mất toàn bộ dữ liệu tồn kho. Bạn có chắc chắn muốn xoá?`,
      });
    }

    await prisma.productKey.deleteMany({ where: { productId: id } });
    await prisma.bulkDiscount.deleteMany({ where: { productId: id } });
    await prisma.product.update({
      where: { id },
      data: {
        name: "[Đã xóa]",
        slug: `deleted-${id}`,
        description: null,
        shortDesc: null,
        guide: null,
        price: 0,
        salePrice: null,
        stock: 0,
        sku: null,
        images: "",
        status: "HIDDEN",
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "DELETE_PRODUCT",
        entity: "Product",
        entityId: id,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

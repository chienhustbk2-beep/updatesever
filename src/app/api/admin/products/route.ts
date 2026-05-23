import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}
export async function GET() {
  try {
    const admin = await checkAdmin();
    if (!admin || (admin.role !== "ADMIN" && admin.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
        _count: {
          select: { productKeys: true },
        },
      },
    });

    const productIds = products.map((p) => p.id);

    const [availableGroups, soldGroups] = await Promise.all([
      prisma.productKey.groupBy({
        by: ["productId"],
        _count: { id: true },
        where: { productId: { in: productIds }, status: "AVAILABLE" },
      }),
      prisma.productKey.groupBy({
        by: ["productId"],
        _count: { id: true },
        where: { productId: { in: productIds }, status: "SOLD" },
      }),
    ]);

    const availableMap = new Map(
      availableGroups.map((g) => [g.productId, g._count.id]),
    );
    const soldMap = new Map(
      soldGroups.map((g) => [g.productId, g._count.id]),
    );

    const productsWithCounts = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      salePrice: p.salePrice,
      stock: p.stock,
      status: p.status,
      type: p.type,
      categoryId: p.categoryId,
      categoryName: p.category?.name || null,
      keyCount: p._count.productKeys,
      availableKeys: availableMap.get(p.id) ?? 0,
      soldKeys: soldMap.get(p.id) ?? 0,
    }));

    return NextResponse.json({ products: productsWithCounts });
  } catch (error) {
    console.error("Get products error:", error);
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
    const {
      name,
      slug,
      description,
      guide,
      price,
      salePrice,
      stock,
      sku,
      type,
      categoryId,
      images,
      status,
      bulkDiscounts,
    } = body;

    if (!name || !slug || !price) {
      return NextResponse.json(
        { error: "Tên, slug và giá là bắt buộc" },
        { status: 400 },
      );
    }
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    });
    if (existingProduct) {
      return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 400 });
    }
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || null,
        guide: guide || null,
        price: parseFloat(price),
        salePrice: salePrice ? parseFloat(salePrice) : null,
        stock: parseInt(stock) || 0,
        sku: sku || null,
        type: type || "SOFTWARE_KEY",
        status: status || "ACTIVE",
        categoryId: categoryId || null,
        images: images || "",
        bulkDiscounts:
          bulkDiscounts && bulkDiscounts.length > 0
            ? {
                create: bulkDiscounts.map(
                  (d: { minQty: number; discount: number }) => ({
                    minQty: d.minQty,
                    discount: d.discount,
                  }),
                ),
              }
            : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "CREATE_PRODUCT",
        entity: "Product",
        entityId: product.id,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi tạo sản phẩm" },
      { status: 500 },
    );
  }
}

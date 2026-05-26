import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CartItem } from "@/store/useCartStore";

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Bạn cần đăng nhập để thực hiện" },
        { status: 401 },
      );
    }
    const userId = session.user.id;
    const body: { cartItems: CartItem[] } = await request.json();
    const { cartItems } = body;

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: "Giỏ hàng trống" }, { status: 400 });
    }

    // Kiểm tra sản phẩm còn kinh doanh + tồn kho
    const productIds = [...new Set(cartItems.map((i) => i.productId))];
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, status: true, name: true, stock: true, type: true, _count: { select: { productKeys: { where: { status: "AVAILABLE" } } } } },
    });
    const productStockMap = new Map(dbProducts.map((p) => [p.id, p.type === "SOFTWARE_KEY" || p.type === "LICENSE_KEY" || p.type === "SUBSCRIPTION" ? p._count.productKeys : p.stock]));
    const productStatusMap = new Map(dbProducts.map((p) => [p.id, p.status]));

    const unavailableProducts: { id: string; name: string; reason: "hidden" | "out_of_stock" }[] = [];
    const stockWarnings: { id: string; name: string; available: number; requested: number }[] = [];

    for (const item of cartItems) {
      const status = productStatusMap.get(item.productId);
      if (!status || status === "HIDDEN" || status === "DRAFT") {
        unavailableProducts.push({ id: item.productId, name: item.name, reason: "hidden" });
        continue;
      }
      const available = productStockMap.get(item.productId) ?? 0;
      if (status === "OUT_OF_STOCK" || available <= 0) {
        unavailableProducts.push({ id: item.productId, name: item.name, reason: "out_of_stock" });
        continue;
      }
      if (item.quantity > available) {
        stockWarnings.push({ id: item.productId, name: item.name, available, requested: item.quantity });
      }
    }

    if (unavailableProducts.length > 0) {
      return NextResponse.json({
        success: false,
        unavailableProducts,
        stockWarnings,
        message: "Một số sản phẩm không khả dụng, vui lòng xoá khỏi giỏ hàng.",
      }, { status: 200 });
    }

    // Tính tổng tiền
    let totalAmount = 0;
    for (const item of cartItems) {
      const price = item.salePrice ?? item.price;
      const applicableDiscount = item.bulkDiscounts
        ?.filter((d) => d.minQty <= item.quantity)
        .sort((a, b) => b.minQty - a.minQty)[0];
      const discountPercent = applicableDiscount?.discount ?? 0;
      const discountedPrice =
        discountPercent > 0 ? price * (1 - discountPercent / 100) : price;
      totalAmount += discountedPrice * item.quantity;
    }
    totalAmount = Math.round(totalAmount * 100) / 100;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Không tìm thấy tài khoản" },
        { status: 404 },
      );
    }

    // Tìm đơn hàng PENDING/UNPAID hiện tại của user
    const existingOrder = await prisma.order.findFirst({
      where: {
        userId,
        status: "PENDING",
        paymentStatus: "UNPAID",
      },
      include: { items: true },
    });
    const result = await prisma.$transaction(async (tx) => {
      let order: {
        id: string;
        orderNumber: string;
        totalAmount: number;
        finalAmount: number;
        status: string;
        paymentStatus: string;
        createdAt: Date;
        items: {
          id: string;
          quantity: number;
          price: number;
          total: number;
          product: {
            id: string;
            name: string;
            images: string;
            slug: string;
            salePrice: number | null;
          };
        }[];
      };
      if (existingOrder) {
        // Xóa các item cũ trong đơn hàng
        await tx.orderItem.deleteMany({
          where: { orderId: existingOrder.id },
        });

        // Tạo lại các item mới từ giỏ hàng
        for (const cartItem of cartItems) {
          const price = cartItem.salePrice ?? cartItem.price;
          const applicableDiscount = cartItem.bulkDiscounts
            ?.filter((d) => d.minQty <= cartItem.quantity)
            .sort((a, b) => b.minQty - a.minQty)[0];
          const discountPercent = applicableDiscount?.discount ?? 0;
          const discountedPrice =
            discountPercent > 0 ? price * (1 - discountPercent / 100) : price;
          const itemTotal =
            Math.round(discountedPrice * cartItem.quantity * 100) / 100;

          await tx.orderItem.create({
            data: {
              orderId: existingOrder.id,
              productId: cartItem.productId,
              quantity: cartItem.quantity,
              price: discountedPrice,
              total: itemTotal,
            },
          });
        }

        // Cập nhật tổng tiền
        order = await tx.order.update({
          where: { id: existingOrder.id },
          data: {
            totalAmount,
            finalAmount: totalAmount,
            customerEmail: user.email,
            customerName: user.name || "",
            customerPhone: user.phone || undefined,
          },
          include: { items: { include: { product: true } } },
        });
      } else {
        // Tạo đơn hàng PENDING mới
        const orderNumber = generateOrderNumber();

        order = await tx.order.create({
          data: {
            orderNumber,
            userId,
            totalAmount,
            discountAmount: 0,
            finalAmount: totalAmount,
            status: "PENDING",
            paymentMethod: "BANK_TRANSFER",
            paymentStatus: "UNPAID",
            customerEmail: user.email,
            customerName: user.name || "",
            customerPhone: user.phone || undefined,
            items: {
              create: cartItems.map((cartItem) => {
                const price = cartItem.salePrice ?? cartItem.price;
                const applicableDiscount = cartItem.bulkDiscounts
                  ?.filter((d) => d.minQty <= cartItem.quantity)
                  .sort((a, b) => b.minQty - a.minQty)[0];
                const discountPercent = applicableDiscount?.discount ?? 0;
                const discountedPrice =
                  discountPercent > 0
                    ? price * (1 - discountPercent / 100)
                    : price;
                const itemTotal =
                  Math.round(discountedPrice * cartItem.quantity * 100) / 100;

                return {
                  productId: cartItem.productId,
                  quantity: cartItem.quantity,
                  price: discountedPrice,
                  total: itemTotal,
                };
              }),
            },
          },
          include: { items: { include: { product: true } } },
        });
      }
      return { order };
    });
    return NextResponse.json(
      {
        success: true,
        unavailableProducts,
        order: {
          id: result.order.id,
          orderNumber: result.order.orderNumber,
          totalAmount: result.order.totalAmount,
          finalAmount: result.order.finalAmount,
          status: result.order.status,
          paymentStatus: result.order.paymentStatus,
          createdAt: result.order.createdAt,
          items: result.order.items.map(
            (item: {
              id: string;
              quantity: number;
              price: number;
              total: number;
              product: {
                id: string;
                name: string;
                images: string;
                slug: string;
                salePrice: number | null;
              };
            }) => ({
              id: item.id,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
              product: {
                id: item.product.id,
                name: item.product.name,
                images: item.product.images,
                slug: item.product.slug,
                salePrice: item.product.salePrice,
              },
            }),
          ),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Sync cart to order error:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi đồng bộ giỏ hàng" },
      { status: 500 },
    );
  }
}

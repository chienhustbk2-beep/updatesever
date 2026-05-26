import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendMail, orderConfirmationTemplate } from "@/lib/mail";
import { checkoutSchema } from "@/lib/validations";

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

function generateTransactionCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TXN-${timestamp}-${random}`;
}

function generateAccountCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    let userId: string | null = session?.user?.id || null;

    const bodyParsed = checkoutSchema.safeParse(await request.json());
    if (!bodyParsed.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: bodyParsed.error.issues[0]?.message },
        { status: 400 },
      );
    }
    const { cartItems: rawItems, couponCode, paymentMethod = "BALANCE", guestEmail, guestName } = bodyParsed.data;

    // Fetch real prices from DB — NEVER trust client-supplied prices
    const productIds = [...new Set(rawItems.map((i) => i.productId))];
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true, salePrice: true, bulkDiscounts: true, status: true, name: true },
    });
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    const cartItems = rawItems.map((item) => {
      const dbProduct = productMap.get(item.productId);
      if (!dbProduct) throw new Error(`Sản phẩm "${item.name}" không tồn tại`);
      if (dbProduct.status === "HIDDEN" || dbProduct.status === "DRAFT") {
        throw new Error(`Sản phẩm "${dbProduct.name}" đã ngừng kinh doanh, vui lòng xóa khỏi giỏ hàng.`);
      }
      return { ...item, price: dbProduct.price, salePrice: dbProduct.salePrice, bulkDiscounts: dbProduct.bulkDiscounts };
    });

    let totalAmount = 0;
    for (const item of cartItems) {
      const price = item.salePrice ?? item.price;
      const applicableDiscount = item.bulkDiscounts
        ?.filter((d) => d.minQty <= item.quantity)
        .sort((a, b) => b.minQty - a.minQty)[0];
      const discountPercent = applicableDiscount?.discount ?? 0;
      const discountedPrice = discountPercent > 0 ? price * (1 - discountPercent / 100) : price;
      totalAmount += discountedPrice * item.quantity;
    }

    totalAmount = Math.round(totalAmount * 100) / 100;

    let discountAmount = 0;
    let appliedCouponId: string | null = null;
    const now = new Date();

    if (couponCode && userId) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });
      if (coupon && coupon.isActive && now >= coupon.validFrom && now <= coupon.validUntil) {
        if (!coupon.maxUses || coupon.usedCount < coupon.maxUses) {
          if (!coupon.minOrderAmount || totalAmount >= coupon.minOrderAmount) {
            const alreadyUsed = await prisma.userCoupon.findUnique({
              where: { userId_couponId: { userId, couponId: coupon.id } },
            });
            if (!alreadyUsed) {
              discountAmount =
                coupon.type === "PERCENTAGE"
                  ? Math.round((totalAmount * coupon.value) / 100)
                  : coupon.value;
              appliedCouponId = coupon.id;
            }
          }
        }
      }
    }
    const finalAmount = totalAmount - discountAmount;

    const orderNumber = generateOrderNumber();
    const transactionCode = generateTransactionCode();

    if (paymentMethod === "BALANCE") {
      if (!userId) {
        return NextResponse.json({ error: "Cần đăng nhập để thanh toán bằng số dư" }, { status: 401 });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json({ error: "Không tìm thấy tài khoản" }, { status: 404 });
      }
      if (user.balance < finalAmount) {
        return NextResponse.json({
          error: "Số dư không đủ",
          currentBalance: user.balance,
          required: finalAmount,
        }, { status: 400 });
      }

      const result = await processBalancePayment({
        userId,
        orderNumber,
        totalAmount,
        discountAmount,
        finalAmount,
        appliedCouponId,
        cartItems,
        user,
      });

      return NextResponse.json({
        success: true,
        message: "Thanh toán thành công! Key đã được giao.",
        order: {
          id: result.order.id,
          orderNumber: result.order.orderNumber,
          totalAmount: result.order.totalAmount,
          status: result.order.status,
          createdAt: result.order.createdAt,
        },
        keys: result.soldKeys,
      }, { status: 200 });
    } else {
      const result = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            orderNumber,
            userId,
            totalAmount,
            discountAmount,
            finalAmount,
            status: "PENDING",
            paymentMethod: paymentMethod as "BANK_TRANSFER" | "BALANCE",
            paymentStatus: "UNPAID",
            customerEmail: guestEmail || "",
            customerName: guestName || "",
            transactionCode,
          },
        });

        for (const cartItem of cartItems) {
          const price = cartItem.salePrice ?? cartItem.price;
          const applicableDiscount = cartItem.bulkDiscounts
            ?.filter((d) => d.minQty <= cartItem.quantity)
            .sort((a, b) => b.minQty - a.minQty)[0];
          const discountPercent = applicableDiscount?.discount ?? 0;
          const discountedPrice = discountPercent > 0 ? price * (1 - discountPercent / 100) : price;
          const itemTotal = Math.round(discountedPrice * cartItem.quantity * 100) / 100;

          await tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: cartItem.productId,
              quantity: cartItem.quantity,
              price: discountedPrice,
              total: itemTotal,
            },
          });
        }

        if (appliedCouponId && userId) {
          await tx.coupon.update({
            where: { id: appliedCouponId },
            data: { usedCount: { increment: 1 } },
          });
          await tx.userCoupon.create({
            data: { userId, couponId: appliedCouponId },
          });
        }

        return { order };
      });

      const paymentInfo = getPaymentInfo(paymentMethod, result.order, finalAmount);
      return NextResponse.json({
        success: true,
        message: "Đơn hàng đã được tạo. Vui lòng thanh toán để nhận key.",
        order: {
          id: result.order.id,
          orderNumber: result.order.orderNumber,
          totalAmount: result.order.totalAmount,
          finalAmount: result.order.finalAmount,
          status: result.order.status,
          paymentMethod: result.order.paymentMethod,
          paymentStatus: result.order.paymentStatus,
          transactionCode: result.order.transactionCode,
          createdAt: result.order.createdAt,
        },
        paymentInfo,
      }, { status: 200 });
    }
  } catch (error) {
    console.error("Checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage.includes("Không đủ số lượng")) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    return NextResponse.json({ error: "Có lỗi xảy ra trong quá trình thanh toán" }, { status: 500 });
  }
}

async function processBalancePayment({
  userId,
  orderNumber,
  totalAmount,
  discountAmount,
  finalAmount,
  appliedCouponId,
  cartItems,
  user,
}: {
  userId: string;
  orderNumber: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  appliedCouponId: string | null;
  cartItems: Array<{ productId: string; name: string; price: number; salePrice: number | null; quantity: number; bulkDiscounts?: Array<{ minQty: number; discount: number }> }>;
  user: { id: string; email: string; name: string | null };
}) {
  // Toàn bộ logic trong 1 $transaction atomic:
  // Nếu bất kỳ bước nào lỗi => Rollback toàn bộ, tiền không bị trừ oan
  const result = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: finalAmount } },
    });

    await tx.transaction.create({
      data: {
        userId,
        type: "PAYMENT",
        amount: -finalAmount,
        description: `Thanh toán đơn hàng ${orderNumber}`,
        status: "SUCCESS",
      },
    });

    if (appliedCouponId) {
      await tx.coupon.update({
        where: { id: appliedCouponId },
        data: { usedCount: { increment: 1 } },
      });
      await tx.userCoupon.create({
        data: { userId, couponId: appliedCouponId },
      });
    }

    const order = await tx.order.create({
      data: {
        orderNumber,
        userId,
        totalAmount,
        discountAmount,
        finalAmount,
        status: "COMPLETED",
        paymentMethod: "BALANCE",
        paymentStatus: "PAID",
        customerEmail: user.email,
        customerName: user.name || "",
      },
    });

    const soldKeys: { productId: string; productName: string; keyValue: string }[] = [];

    for (const cartItem of cartItems) {
      const price = cartItem.salePrice ?? cartItem.price;
      const applicableDiscount = cartItem.bulkDiscounts
        ?.filter((d) => d.minQty <= cartItem.quantity)
        .sort((a, b) => b.minQty - a.minQty)[0];
      const discountPercent = applicableDiscount?.discount ?? 0;
      const discountedPrice = discountPercent > 0 ? price * (1 - discountPercent / 100) : price;
      const itemTotal = Math.round(discountedPrice * cartItem.quantity * 100) / 100;

      // Race-condition prevention: Atomic updateMany with status filter,
      // dùng updateMany đếm số bản ghi thực sự được cập nhật
      const keyIdsResult = await tx.productKey.findMany({
        where: { productId: cartItem.productId, status: "AVAILABLE" },
        select: { id: true, keyValue: true },
        take: cartItem.quantity,
        orderBy: { createdAt: "asc" },
      });

      if (keyIdsResult.length < cartItem.quantity) {
        throw new Error(
          `Không đủ số lượng sản phẩm "${cartItem.name}" trong kho. Còn lại: ${keyIdsResult.length}, Cần: ${cartItem.quantity}`,
        );
      }

      const orderItem = await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: cartItem.productId,
          quantity: cartItem.quantity,
          price: discountedPrice,
          total: itemTotal,
        },
      });

      // Atomic: chỉ update keys còn AVAILABLE, tránh double-sell
      const updateResult = await tx.productKey.updateMany({
        where: { id: { in: keyIdsResult.map((k) => k.id) }, status: "AVAILABLE" },
        data: {
          status: "SOLD",
          orderItemId: orderItem.id,
          soldAt: new Date(),
        },
      });

      // Nếu số key thực sự update được ít hơn yêu cầu => có conflict, rollback
      if (updateResult.count < cartItem.quantity) {
        throw new Error(
          `Xung đột: key sản phẩm "${cartItem.name}" vừa bị người khác mua. Còn lại: ${updateResult.count}, Cần: ${cartItem.quantity}`,
        );
      }

      await tx.product.update({
        where: { id: cartItem.productId },
        data: { stock: { decrement: cartItem.quantity } },
      });

      for (const key of keyIdsResult) {
        soldKeys.push({
          productId: cartItem.productId,
          productName: cartItem.name,
          keyValue: key.keyValue,
        });
        await tx.download.create({
          data: {
            orderId: order.id,
            userId,
            productKey: key.keyValue,
            downloadUrl: null,
            maxDownloads: 5,
          },
        });
      }
    }

    return { order, soldKeys };
  });

  // Gửi email trong try-catch riêng: Nếu lỗi email, đơn hàng VẪN thành công
  if (user.email) {
    try {
      const itemRows = cartItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: ((item.salePrice ?? item.price) * item.quantity).toLocaleString("vi-VN"),
      }));
      sendMail({
        to: user.email,
        subject: `Đơn hàng ${result.order.orderNumber} - Thanh toán thành công`,
        html: orderConfirmationTemplate({
          userName: user.name || user.email,
          orderNumber: result.order.orderNumber,
          amount: finalAmount.toLocaleString("vi-VN"),
          items: itemRows,
          email: user.email,
        }),
      }).catch((err) => {
        console.error("[Checkout] Email fallback error:", err);
      });
    } catch (emailErr) {
      console.error("[Checkout] Email send failed (order still successful):", emailErr);
    }
  }

  return result;
}

// Helper function to get payment info based on method
function getPaymentInfo(
  paymentMethod: string,
  order: { id: string; transactionCode?: string | null; orderNumber: string },
  amount: number,
) {
  switch (paymentMethod) {
    case "BANK_TRANSFER":
      return {
        type: "bank_transfer",
        bankName: "Vietcombank",
        accountNumber: "0123456789",
        accountName: "CONG TY TNHH SOFTWARE KEY",
        amount: amount,
        content: order.transactionCode || order.orderNumber,
        qrCode: "/api/qr/bank-transfer?orderId=" + order.id,
      };

    default:
      return null;
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin || (admin.role !== "ADMIN" && admin.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "7d";

    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "yesterday":
        startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 1,
        );
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [
      totalRevenue,
      totalOrders,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      refundedOrders,
      newUsers,
      soldKeys,
      totalUsers,
      onlineUsers,
      pendingTickets,
      pendingReviews,
      recentOrders,
      topCustomers,
      topDepositors,
      revenueByMethod,
    ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { finalAmount: true },
        where: { status: "COMPLETED", createdAt: { gte: startDate } },
      }),
      prisma.order.count({ where: { createdAt: { gte: startDate } } }),
      prisma.order.count({
        where: { status: "COMPLETED", createdAt: { gte: startDate } },
      }),
      prisma.order.count({
        where: { status: "PENDING", createdAt: { gte: startDate } },
      }),
      prisma.order.count({
        where: { status: "CANCELLED", createdAt: { gte: startDate } },
      }),
      prisma.order.count({
        where: { status: "REFUNDED", createdAt: { gte: startDate } },
      }),
      prisma.user.count({ where: { createdAt: { gte: startDate } } }),
      prisma.productKey.count({
        where: { status: "SOLD", soldAt: { gte: startDate } },
      }),
      prisma.user.count(),
      prisma.activeSession.count({
        where: { lastSeen: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
      }),
      prisma.supportTicket.count({
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      }),
      prisma.review.count({ where: { createdAt: { gte: startDate } } }),
      prisma.order.findMany({
        where: { createdAt: { gte: startDate } },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: { select: { name: true, email: true } },
          items: { take: 3, include: { product: { select: { name: true } } } },
        },
      }),
      prisma.order.groupBy({
        by: ["userId"],
        _sum: { finalAmount: true },
        _count: { id: true },
        where: { status: "COMPLETED", createdAt: { gte: startDate } },
        orderBy: { _sum: { finalAmount: "desc" } },
        take: 10,
      }),
      prisma.transaction.groupBy({
        by: ["userId"],
        _sum: { amount: true },
        _count: { id: true },
        where: { status: "SUCCESS", createdAt: { gte: startDate } },
        orderBy: { _sum: { amount: "desc" } },
        take: 10,
      }),
      prisma.order.groupBy({
        by: ["paymentMethod"],
        _sum: { finalAmount: true },
        _count: { id: true },
        where: { status: "COMPLETED", createdAt: { gte: startDate } },
      }),
    ]);
    const topCustomerDetails = await Promise.all(
      topCustomers.map(async (c) => {
        if (!c.userId) {
          return { userId: "", name: "Khách vãng lai", email: "", totalSpent: c._sum.finalAmount || 0, orderCount: c._count.id };
        }
        const u = await prisma.user.findUnique({
          where: { id: c.userId },
          select: { name: true, email: true },
        });
        return {
          userId: c.userId,
          name: u?.name || u?.email || "N/A",
          email: u?.email || "",
          totalSpent: c._sum.finalAmount || 0,
          orderCount: c._count.id,
        };
      }),
    );
    const topDepositorDetails = await Promise.all(
      topDepositors.map(async (d) => {
        const u = await prisma.user.findUnique({
          where: { id: d.userId },
          select: { name: true, email: true },
        });
        return {
          userId: d.userId,
          name: u?.name || u?.email || "N/A",
          email: u?.email || "",
          totalDeposit: d._sum.amount || 0,
          txCount: d._count.id,
        };
      }),
    );
    const lowStockProducts = await prisma.product.findMany({
      where: { stock: { lt: 5 }, status: "ACTIVE" },
      select: { id: true, name: true, stock: true, slug: true },
      orderBy: { stock: "asc" },
      take: 10,
    });
    const dailyRevenue = await prisma.order.groupBy({
      by: ["createdAt"],
      _sum: { finalAmount: true },
      _count: true,
      where: { status: "COMPLETED", createdAt: { gte: startDate } },
    });
    const categoryRevenue = await prisma.category.findMany({
      include: {
        products: {
          include: {
            orderItems: {
              where: {
                order: { status: "COMPLETED", createdAt: { gte: startDate } },
              },
              select: { total: true },
            },
          },
        },
      },
    });
    const categoryBreakdown = categoryRevenue
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        revenue: cat.products.reduce(
          (sum, prod) =>
            sum + prod.orderItems.reduce((pSum, item) => pSum + item.total, 0),
          0,
        ),
      }))
      .filter((c) => c.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue);
    const previousPeriodStart = new Date(
      startDate.getTime() - (now.getTime() - startDate.getTime()),
    );
    const prevRevenue = await prisma.order.aggregate({
      _sum: { finalAmount: true },
      where: {
        status: "COMPLETED",
        createdAt: { gte: previousPeriodStart, lt: startDate },
      },
    });
    const prevRevenueTotal = prevRevenue._sum.finalAmount || 0;
    const currentRevenueTotal = totalRevenue._sum.finalAmount || 0;
    const revenueGrowth =
      prevRevenueTotal > 0
        ? ((currentRevenueTotal - prevRevenueTotal) / prevRevenueTotal) * 100
        : currentRevenueTotal > 0
          ? 100
          : 0;

    return NextResponse.json({
      stats: {
        totalRevenue: currentRevenueTotal,
        totalOrders,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        refundedOrders,
        newUsers,
        totalUsers,
        onlineUsers,
        soldKeys,
        pendingTickets,
        pendingReviews,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      },
      topCustomers: topCustomerDetails,
      topDepositors: topDepositorDetails,
      recentOrders,
      lowStockProducts,
      dailyRevenue,
      categoryBreakdown,
      revenueByMethod: revenueByMethod.map((r) => ({
        method: r.paymentMethod,
        total: r._sum.finalAmount || 0,
        count: r._count.id,
      })),
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

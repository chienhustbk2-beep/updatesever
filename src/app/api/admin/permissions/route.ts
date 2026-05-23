import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getNavItems,
  getQuickActions,
  getRoutePermissions,
} from "@/lib/permissions";

export async function GET() {
  try {
    const session = await auth();
if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 }) }const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 }) }const setting = await prisma.systemSettings.findUnique({
      where: { key: "permissions_config" },
    });
    const savedConfig = setting ? JSON.parse(setting.value) : null;

    return NextResponse.json({
      role: user.role,
      navItems: getNavItems(user.role),
      quickActions: getQuickActions(user.role),
      config: getRoutePermissions(),
      savedConfig,
    });
}
catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    ) }}
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 }) }const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 }) }const body = await request.json();
    const { routes, apiRoutes } = body;

    if (!routes || !apiRoutes) {
      return NextResponse.json(
        { error: "Thiếu dữ liệu routes và apiRoutes" },
        { status: 400 },
      ) }const config = JSON.stringify({ routes, apiRoutes });

    await prisma.systemSettings.upsert({
      where: { key: "permissions_config" },
      update: { value: config },
      create: {
        key: "permissions_config",
        value: config,
        description: "Cấu hình phân quyền",
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "UPDATE_PERMISSIONS",
        entity: "Permissions",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({ success: true });
}
catch (error) {
    console.error("Update permissions error:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi lưu cấu hình" },
      { status: 500 },
    ) }
}

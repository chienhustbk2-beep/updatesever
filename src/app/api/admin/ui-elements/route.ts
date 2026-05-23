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
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const elements = await prisma.uIElement.findMany({
      orderBy: [{ section: "asc" }, { sortOrder: "asc" }],
    });
    return NextResponse.json({ elements });
  } catch (error) {
    console.error("Get UI elements error:", error);
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
      key,
      section,
      isVisible,
      sortOrder,
      position,
      customText,
      customColor,
    } = body;

    if (!name || !key || !section) {
      return NextResponse.json(
        { error: "Name, key, and section are required" },
        { status: 400 },
      );
    }
    const existing = await prisma.uIElement.findUnique({
      where: { key },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Key already exists" },
        { status: 400 },
      );
    }
    const element = await prisma.uIElement.create({
      data: {
        name,
        key,
        section,
        isVisible: isVisible ?? true,
        sortOrder: sortOrder ?? 0,
        position: position || "default",
        customText: customText || null,
        customColor: customColor || null,
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "CREATE_UI_ELEMENT",
        entity: "uIElement",
        entityId: element.id,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });
    return NextResponse.json({ success: true, element }, { status: 201 });
  } catch (error) {
    console.error("Create UI element error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

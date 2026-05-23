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
    const { name, isVisible, position, customText, customColor, section, sortOrder } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (isVisible !== undefined) updateData.isVisible = isVisible;
    if (position !== undefined) updateData.position = position;
    if (customText !== undefined) updateData.customText = customText;
    if (customColor !== undefined) updateData.customColor = customColor;
    if (section !== undefined) updateData.section = section;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const element = await prisma.uIElement.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "UPDATE_UI_ELEMENT",
        entity: "uIElement",
        entityId: id,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({ success: true, element });
  } catch (error) {
    console.error("Update UI element error:", error);
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
    await prisma.uIElement.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "DELETE_UI_ELEMENT",
        entity: "uIElement",
        entityId: id,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete UI element error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

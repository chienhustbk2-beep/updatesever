import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Check if user owns this ticket
    if (ticket.userId !== session.user.id) {
      // Check if user is admin/staff
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      if (user?.role !== "ADMIN" && user?.role !== "STAFF") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }
    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Get ticket error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

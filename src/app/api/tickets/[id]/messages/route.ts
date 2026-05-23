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
      },
    });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    if (ticket.userId !== session.user.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      if (user?.role !== "ADMIN" && user?.role !== "STAFF") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }
    return NextResponse.json({ messages: ticket.messages });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 },
      );
    }
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Check if ticket is closed
    if (ticket.status === "CLOSED") {
      return NextResponse.json({ error: "Ticket is closed" }, { status: 400 });
    }

    // Determine if user is staff
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    const isStaff = user?.role === "ADMIN" || user?.role === "STAFF";

    // Check permissions
    if (!isStaff && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Create message
    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        content,
        isStaff,
      },
    });

    // Update ticket status
    if (isStaff && ticket.status === "OPEN") {
      await prisma.supportTicket.update({
        where: { id },
        data: { status: "IN_PROGRESS" },
      });
    } else if (!isStaff && ticket.status === "IN_PROGRESS") {
      // Keep as IN_PROGRESS when customer replies
    }
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Create message error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

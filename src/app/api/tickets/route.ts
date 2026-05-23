import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { userId: session.user.id }
    if (status) {
      where.status = status }const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ tickets });
}
catch (error) {
    console.error("Get tickets error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    ) }}
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }const body = await request.json();
    const { subject, message, orderId } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 },
      ) }const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.user.id,
        subject,
        message,
        orderId: orderId || null,
      },
    });

    // Create first message
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        content: message,
        isStaff: false,
      },
    })
return NextResponse.json({ ticket }, { status: 201 });
}
catch (error) {
    console.error("Create ticket error:", error)
return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    ) }
}

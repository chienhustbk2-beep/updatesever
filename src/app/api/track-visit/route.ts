import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    let sessionId = cookieStore.get("visitor_session")?.value;
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "";
    const { path } = await request.json().catch(() => ({ path: "/" }));
if (!sessionId) {
      sessionId = crypto.randomUUID() }

    await prisma.activeSession.upsert({
      where: { sessionId },
      update: { lastSeen: new Date(), ip, userAgent },
      create: { sessionId, ip, userAgent },
    });

    await prisma.visitLog.create({
      data: { sessionId, ip, userAgent, path },
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set("visitor_session", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return response } catch {
    return NextResponse.json({ ok: true }) }
}

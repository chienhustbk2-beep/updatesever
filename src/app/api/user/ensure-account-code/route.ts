import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.accountCode) {
      return NextResponse.json({ success: true, accountCode: user.accountCode });
    }

    let accountCode: string;
    let isUnique = false;
    do {
      accountCode = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await prisma.user.findUnique({ where: { accountCode } });
      if (!existing) isUnique = true;
    } while (!isUnique);

    await prisma.user.update({
      where: { id: user.id },
      data: { accountCode },
    });

    return NextResponse.json({ success: true, accountCode });
  } catch (error) {
    console.error("[Ensure AccountCode] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

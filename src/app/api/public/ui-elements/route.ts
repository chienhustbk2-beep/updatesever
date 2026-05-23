import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const elements = await prisma.uIElement.findMany({
      orderBy: [{ section: "asc" }, { sortOrder: "asc" }],
    });
    const map: Record<
      string,
      {
        isVisible: boolean;
        customText: string | null;
        customColor: string | null;
        position: string;
      }
    > = {};
    elements.forEach((el) => {
      map[el.key] = {
        isVisible: el.isVisible,
        customText: el.customText,
        customColor: el.customColor,
        position: el.position,
      };
    });
    return NextResponse.json({ elements: map });
  } catch {
    return NextResponse.json({ elements: {} });
  }
}

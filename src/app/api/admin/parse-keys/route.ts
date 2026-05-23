import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await request.json();
    const { keys, productId } = body;

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ error: "No keys provided" }, { status: 400 });
    }
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const parsedKeys = keys
      .map((k: string) => k.trim())
      .filter((k: string) => k.length > 0)
      .map((k: string) => ({
        keyValue: k,
        productId,
        status: "AVAILABLE" as const,
      }));
    const existingKeys = await prisma.productKey.findMany({
      where: {
        productId,
        keyValue: {
          in: parsedKeys.map((k: { keyValue: string }) => k.keyValue),
        },
      },
      select: { keyValue: true },
    });
    const existingKeyValues = new Set(existingKeys.map((k) => k.keyValue));
    const result = {
      total: parsedKeys.length,
      valid: parsedKeys.filter(
        (k: { keyValue: string }) => !existingKeyValues.has(k.keyValue),
      ),
      duplicates: parsedKeys.filter((k: { keyValue: string }) =>
        existingKeyValues.has(k.keyValue),
      ),
    };
    return NextResponse.json({ parsed: result });
  } catch (error) {
    console.error("Parse keys error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

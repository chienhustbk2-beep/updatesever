import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { execSync } from "child_process";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const zipPath = "/tmp/uploaded-update.zip";
    writeFileSync(zipPath, buffer);

    let version = "";
    try {
      version = execSync(`unzip -p "${zipPath}" version.txt 2>/dev/null`, { encoding: "utf-8" }).trim();
    } catch {}

    return NextResponse.json({
      success: true,
      version: version || null,
      message: version ? `Uploaded update.zip (v${version})` : "Uploaded update.zip (không tìm thấy version.txt trong file)",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string[] }> }
) {
  const { filename: segments } = await params;
  const filePath = path.join(process.cwd(), "public", "uploads", ...segments);

  // Security: prevent path traversal
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.join(process.cwd(), "public", "uploads"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const buffer = fs.readFileSync(resolved);
    const ext = path.extname(resolved).toLowerCase();
    const mime: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
    };
    const contentType = mime[ext] || "application/octet-stream";
    return new NextResponse(buffer, {
      headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function parseGitHubUrl(fullUrl: string): { url: string; token: string } {
  try {
    const u = new URL(fullUrl);
    const token = u.password || u.username || '';
    u.username = '';
    u.password = '';
    return { url: u.toString().replace(/\/$/, ''), token };
  } catch {
    return { url: fullUrl, token: '' };
  }
}

async function fetchWithToken(urlStr: string): Promise<Response> {
  const { url, token } = parseGitHubUrl(urlStr);
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { headers });
}

function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0, nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

/** POST /api/admin/update/check — kiểm tra phiên bản mới (lightweight) */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const versionUrl = process.env.UPDATE_VERSION_URL;
    if (!versionUrl) {
      return NextResponse.json({ error: "Thiếu UPDATE_VERSION_URL trong .env" }, { status: 400 });
    }

    const resp = await fetchWithToken(versionUrl);
    if (!resp.ok) {
      return NextResponse.json({ error: `Không thể tải version.txt (HTTP ${resp.status})` }, { status: 502 });
    }

    const remoteVersion = (await resp.text()).trim();
    if (!remoteVersion) {
      return NextResponse.json({ error: "version.txt rỗng" }, { status: 400 });
    }

    let currentVersion = "0.0.0";
    try {
      const { readFileSync } = await import("fs");
      const { join } = await import("path");
      const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8"));
      currentVersion = pkg.version || "0.0.0";
    } catch {}

    const hasUpdate = compareVersions(remoteVersion, currentVersion) > 0;

    const now = new Date().toISOString();
    await prisma.systemSettings.upsert({ where: { key: "latest_available_version" }, update: { value: remoteVersion }, create: { key: "latest_available_version", value: remoteVersion } });
    await prisma.systemSettings.upsert({ where: { key: "last_update_check" }, update: { value: now }, create: { key: "last_update_check", value: now } });

    return NextResponse.json({
      currentVersion,
      latestVersion: remoteVersion,
      hasUpdate,
      checkedAt: now,
    });
  } catch (error: any) {
    console.error("Check update error:", error);
    return NextResponse.json({ error: error.message || "Check failed" }, { status: 500 });
  }
}

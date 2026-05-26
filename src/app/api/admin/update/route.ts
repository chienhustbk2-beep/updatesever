import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { execSync, spawn } from "child_process";
import { writeFileSync, mkdirSync, existsSync, readdirSync, cpSync, rmSync, readFileSync } from "fs";
import { join } from "path";

const PROJECT_DIR = process.cwd();
const ZIP_PATH = "/tmp/update.zip";
const EXTRACT_DIR = "/tmp/update-extracted";

// ========== HELPERS ==========

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

function maskUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  const { url, token } = parseGitHubUrl(rawUrl);
  if (!token) return url;
  const masked = token.length > 8 ? token.slice(0, 4) + '...' + token.slice(-4) : '***';
  return url.replace('://', `://${masked}@`);
}

function getCurrentVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(PROJECT_DIR, "package.json"), "utf-8"));
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
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

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

// ========== CÁC BƯỚC ==========

/** Đọc URL từ DB trước, fallback process.env */
async function getUpdateUrls(): Promise<{ versionUrl: string; zipUrl: string }> {
  let versionUrl = process.env.UPDATE_VERSION_URL;
  let zipUrl = process.env.UPDATE_ZIP_URL;

  try {
    const settings = await prisma.systemSettings.findMany({
      where: { key: { in: ["update_version_url", "update_zip_url"] } },
    });
    for (const s of settings) {
      if (s.key === "update_version_url" && s.value) versionUrl = s.value;
      if (s.key === "update_zip_url" && s.value) zipUrl = s.value;
    }
  } catch {}

  if (!versionUrl) throw new Error("Thiếu UPDATE_VERSION_URL. Vào Admin → Cài đặt → tab Cập nhật để cấu hình.");
  if (!zipUrl) throw new Error("Thiếu UPDATE_ZIP_URL. Vào Admin → Cài đặt → tab Cập nhật để cấu hình.");

  return { versionUrl, zipUrl };
}

/** Bước 1+2: Kiểm tra phiên bản từ GitHub */
async function checkRemoteVersion(): Promise<{ remoteVersion: string; hasUpdate: boolean }> {
  const { versionUrl } = await getUpdateUrls();

  const resp = await fetchWithToken(versionUrl);
  if (!resp.ok) throw new Error(`Không thể tải version.txt (HTTP ${resp.status})`);

  const remoteVersion = (await resp.text()).trim();
  if (!remoteVersion) throw new Error("version.txt rỗng");

  const currentVersion = getCurrentVersion();
  const hasUpdate = compareVersions(remoteVersion, currentVersion) > 0;

  return { remoteVersion, hasUpdate };
}

/** Bước 3: Tải & giải nén code từ GitHub */
async function downloadAndExtract(): Promise<void> {
  const { zipUrl } = await getUpdateUrls();

  const resp = await fetchWithToken(zipUrl);
  if (!resp.ok) throw new Error(`Không thể tải update.zip (HTTP ${resp.status})`);
  const buffer = Buffer.from(await resp.arrayBuffer());
  writeFileSync(ZIP_PATH, buffer);

  if (existsSync(EXTRACT_DIR)) rmSync(EXTRACT_DIR, { recursive: true });
  mkdirSync(EXTRACT_DIR, { recursive: true });

  execSync(`unzip -o "${ZIP_PATH}" -d "${EXTRACT_DIR}"`, { stdio: "pipe" });
  rmSync(ZIP_PATH);

  const PROTECTED_DIRS = new Set(["node_modules", ".git", "public/uploads"]);
  const PROTECTED_FILES = new Set([
    ".env", ".env.local", ".env.production", ".env.development",
    "prisma/dev.db", "prisma/prod.db", "prisma/data.db",
  ]);

  const copyAll = (src: string, dest: string) => {
    const entries = readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const sPath = join(src, entry.name);
      const dPath = join(dest, entry.name);
      if (entry.isDirectory()) {
        if (PROTECTED_DIRS.has(entry.name)) continue;
        if (!existsSync(dPath)) mkdirSync(dPath, { recursive: true });
        copyAll(sPath, dPath);
      } else {
        if (PROTECTED_FILES.has(entry.name)) continue;
        cpSync(sPath, dPath, { force: true, recursive: false });
      }
    }
  };

  copyAll(EXTRACT_DIR, PROJECT_DIR);
  rmSync(EXTRACT_DIR, { recursive: true });
}

/** Bước 4: npm install --production + pm2 restart */
function installAndRestart(version: string): void {
  const logFile = join(PROJECT_DIR, "update.log");
  const script = `#!/bin/bash
cd ${PROJECT_DIR}
echo "[$(date)] Installing packages..." >> ${logFile}
npm install --production >> ${logFile} 2>&1
echo "[$(date)] Install done" >> ${logFile}
echo "[$(date)] Restarting pm2..." >> ${logFile}
pm2 restart all >> ${logFile} 2>&1
echo "[$(date)] Updated to ${version}" >> ${logFile}
`;
  writeFileSync(join(PROJECT_DIR, "update.sh"), script, { mode: 0o755 });
  spawn("bash", [join(PROJECT_DIR, "update.sh")], { detached: true, stdio: "ignore" }).unref();
}

// ========== API ROUTES ==========

/** GET /api/admin/update — trả về trạng thái */
export async function GET() {
  try {
    const admin = await checkAdmin();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const settings = await prisma.systemSettings.findMany({
      where: { key: { in: ["last_update_check", "latest_available_version", "auto_update_enabled", "auto_update_interval_minutes", "update_version_url", "update_zip_url", "update_success_version"] } },
    });
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;

    const dbVersionUrl = map.update_version_url || '';
    const dbZipUrl = map.update_zip_url || '';
    const envVersionUrl = process.env.UPDATE_VERSION_URL || '';
    const envZipUrl = process.env.UPDATE_ZIP_URL || '';

    const updateConfigured = !!(dbVersionUrl || envVersionUrl) && !!(dbZipUrl || envZipUrl);

    // Clear success notification after reading
    let updateSuccessVersion = map.update_success_version || null;
    if (updateSuccessVersion) {
      await prisma.systemSettings.delete({ where: { key: "update_success_version" } }).catch(() => {});
    }

    return NextResponse.json({
      currentVersion: getCurrentVersion(),
      updateConfigured,
      updateVersionUrl: maskUrl(dbVersionUrl || envVersionUrl),
      updateZipUrl: maskUrl(dbZipUrl || envZipUrl),
      lastCheck: map.last_update_check || null,
      latestAvailableVersion: map.latest_available_version || null,
      autoUpdateEnabled: map.auto_update_enabled === "true",
      autoUpdateIntervalMinutes: parseInt(map.auto_update_interval_minutes || "360"),
      updateSuccessVersion,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** POST /api/admin/update — full flow: check → download → extract → install → restart */
export async function POST() {
  try {
    const admin = await checkAdmin();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Bước 1+2: Kiểm tra phiên bản
    const { remoteVersion, hasUpdate } = await checkRemoteVersion();

    const now = new Date().toISOString();
    await prisma.systemSettings.upsert({ where: { key: "latest_available_version" }, update: { value: remoteVersion }, create: { key: "latest_available_version", value: remoteVersion } });
    await prisma.systemSettings.upsert({ where: { key: "last_update_check" }, update: { value: now }, create: { key: "last_update_check", value: now } });

    if (!hasUpdate) {
      return NextResponse.json({
        status: "ok",
        message: `Đang ở phiên bản mới nhất (v${getCurrentVersion()})`,
        currentVersion: getCurrentVersion(),
        latestVersion: remoteVersion,
      });
    }

    // Bước 3: Tải & giải nén
    await downloadAndExtract();

    // Lưu thông báo thành công (sẽ hiển thị sau khi restart)
    await prisma.systemSettings.upsert({ where: { key: "update_success_version" }, update: { value: remoteVersion }, create: { key: "update_success_version", value: remoteVersion } });
    await prisma.systemSettings.upsert({ where: { key: "app_version" }, update: { value: remoteVersion }, create: { key: "app_version", value: remoteVersion } });

    // Bước 4: Cài đặt & khởi động
    installAndRestart(remoteVersion);

    return NextResponse.json({
      status: "success",
      message: `Đã cập nhật lên v${remoteVersion}. Server đang build và khởi động lại.`,
      currentVersion: getCurrentVersion(),
      latestVersion: remoteVersion,
    });
  } catch (error: any) {
    console.error("Update error:", error);
    return NextResponse.json({
      status: "error",
      message: error.message || "Cập nhật thất bại",
    }, { status: 500 });
  }
}

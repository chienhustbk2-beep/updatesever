import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_SETTINGS_KEYS = new Set([
  "siteName", "siteLogo", "contactEmail", "contactPhone", "footerText",
  "bankName", "bankAccount", "bankAccountName", "bankCode",
  "smtpHost", "smtpPort", "smtpUser", "smtpPassword", "smtpFromEmail",
  "contactZalo", "contactTelegram", "contactFacebook",
  "activePaymentGateway", "web2mApiToken",
  "web2mEndpoint", "web2mBankPassword", "depositPrefix",
  "enableCaptcha", "captchaType", "captchaSiteKey", "captchaSecretKey",
  "maxLoginAttempts", "lockoutMinutes",
  "session_timeout_minutes",
  "hero_banner_slides",
  "homepage_hero_enabled", "homepage_hero_trust_1", "homepage_hero_trust_2",
  "homepage_trust_enabled", "homepage_cta_enabled",
  "homepage_cta_badge", "homepage_cta_title", "homepage_cta_desc",
  "homepage_cta_register", "homepage_cta_explore",
  "homepage_trust_1_value", "homepage_trust_1_label",
  "homepage_trust_2_value", "homepage_trust_2_label",
  "homepage_trust_3_value", "homepage_trust_3_label",
  "homepage_trust_4_value",   "homepage_trust_4_label",
  "homepage_announcement_enabled", "homepage_announcement_content",
  "homepage_notification_enabled", "homepage_notification_content",
  "homepage_notification_color", "homepage_notification_bg_color",
  "homepage_notification_font_size", "homepage_notification_font_family",
  "homepage_notification_animation",
  "homepage_promo_enabled", "homepage_promo_content",
  "homepage_promo_title", "homepage_promo_title_color",
  "homepage_promo_gradient_from", "homepage_promo_gradient_to",
  "deposit_bonus_rules",
  "app_version", "update_zip_url", "update_version_url",
  "auto_update_enabled", "auto_update_interval_minutes",
  "last_update_check", "latest_available_version",
]);

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}
export async function GET() {
  try {
    const admin = await checkAdmin();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const settings = await prisma.systemSettings.findMany();

    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      if (ALLOWED_SETTINGS_KEYS.has(s.key)) {
        settingsMap[s.key] = s.value;
      }
    }

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "Invalid settings format" },
        { status: 400 },
      );
    }
    const promises = Object.entries(settings)
      .filter(([key]) => ALLOWED_SETTINGS_KEYS.has(key))
      .map(([key, value]) =>
        prisma.systemSettings.upsert({
          where: { key },
          update: { value: value as string },
          create: { key, value: value as string },
        }),
      );

    await Promise.all(promises);

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "UPDATE_SETTINGS",
        entity: "SystemSettings",
        details: JSON.stringify({ keys: Object.keys(settings) }),
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

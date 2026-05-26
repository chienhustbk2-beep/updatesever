import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PUBLIC_SETTINGS_WHITELIST = new Set([
  "bankName", "bankAccount", "bankAccountName", "bankCode",
  "depositPrefix", "activePaymentGateway",
  "siteName", "siteLogo", "footerText",
  "hero_banner_slides",
  "homepage_hero_enabled", "homepage_hero_trust_1", "homepage_hero_trust_2",
  "homepage_cta_enabled", "homepage_trust_enabled",
  "homepage_cta_badge", "homepage_cta_title", "homepage_cta_desc",
  "homepage_cta_register", "homepage_cta_explore",
  "homepage_trust_1_value", "homepage_trust_1_label",
  "homepage_trust_2_value", "homepage_trust_2_label",
  "homepage_trust_3_value", "homepage_trust_3_label",
  "homepage_trust_4_value", "homepage_trust_4_label",
  "contactZalo", "contactTelegram", "contactFacebook",
  "contactPhone", "contactEmail",
  "homepage_announcement_enabled", "homepage_announcement_content",
  "homepage_notification_enabled", "homepage_notification_content",
  "homepage_notification_color", "homepage_notification_bg_color",
  "homepage_notification_font_size", "homepage_notification_font_family",
  "homepage_notification_animation",
  "homepage_promo_enabled", "homepage_promo_content",
  "homepage_promo_title", "homepage_promo_title_color",
  "homepage_promo_gradient_from", "homepage_promo_gradient_to",
  "deposit_bonus_rules",
]);

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.systemSettings.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      if (PUBLIC_SETTINGS_WHITELIST.has(s.key)) {
        settingsMap[s.key] = s.value;
      }
    }
    return NextResponse.json({ settings: settingsMap });
  } catch {
    return NextResponse.json({ settings: {} });
  }
}

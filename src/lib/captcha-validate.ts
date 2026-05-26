import { prisma } from "@/lib/prisma";

export async function validateCaptchaToken(token: string | undefined | null): Promise<{ valid: boolean; error?: string }> {
  const settings = await prisma.systemSettings.findMany();
  const map: Record<string, string> = {};
  settings.forEach((s) => { map[s.key] = s.value });

  if (map.enableCaptcha !== "true") {
    return { valid: true };
  }

  if (!token) {
    return { valid: false, error: "Captcha token la bat buoc" };
  }

  const captchaType = map.captchaType || "reCAPTCHA";

  if (captchaType === "reCAPTCHA") {
    const secretKey = map.captchaSecretKey;
    if (!secretKey) {
      return { valid: false, error: "reCAPTCHA chua duoc cau hinh" };
    }
    try {
      const params = new URLSearchParams({ secret: secretKey, response: token });
      const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        body: params,
      });
      const data = await res.json();
      if (!data.success) {
        return { valid: false, error: "Xac thuc reCAPTCHA that bai" };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: "Loi xac thuc reCAPTCHA" };
    }
  }

  if (captchaType === "slider") {
    return { valid: false, error: "Slider captcha khong ho tro xac thuc server. Vui long cau hinh reCAPTCHA." };
  }

  // Default: text captcha
  return { valid: false, error: "Text captcha khong ho tro xac thuc server. Vui long cau hinh reCAPTCHA." };
}

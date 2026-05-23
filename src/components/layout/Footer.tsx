"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { useUIElements } from "@/components/UIElementsProvider";
export default function Footer() {
  const { settings, t } = useUIElements();
  const pathname = usePathname();
  const router = useRouter();
  const contact = {
    zalo: settings.contactZalo || "",
    telegram: settings.contactTelegram || "",
    facebook: settings.contactFacebook || "",
    email: settings.contactEmail || "",
    phone: settings.contactPhone || "",
  };
  return (
    <footer className="border-t border-divider bg-[var(--bg-card-alt)]">
      {" "}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {" "}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {" "}
          {/* Brand */}{" "}
          <div>
            {" "}
            <button
              onClick={() => {
                if (pathname === '/') { window.scrollTo(0, 0); window.location.reload() }
                else { router.push('/') }
              }}
              className="text-xl font-bold tracking-tight"
            >
              <span className="text-divine-blue text-neon-glow-sm">{settings.siteName || ''}</span>
            </button>{" "}
            <p className="mt-4 text-sm text-muted"> {t("site.desc")} </p>{" "}
            <div className="mt-4 flex gap-3">
              {" "}
              {contact.zalo && (
                <a
                  href={contact.zalo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-white/5 p-2 text-muted transition hover:bg-[var(--primary)]/20 hover:text-[var(--primary)]"
                >
                  {" "}
                  <MessageCircle className="h-5 w-5" />{" "}
                </a>
              )}{" "}
              {contact.telegram && (
                <a
                  href={contact.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-white/5 p-2 text-muted transition hover:bg-[var(--primary)]/20 hover:text-[var(--primary)]"
                >
                  {" "}
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>{" "}
                </a>
              )}{" "}
              {contact.facebook && (
                <a
                  href={contact.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-white/5 p-2 text-muted transition hover:bg-[var(--primary)]/20 hover:text-[var(--primary)]"
                >
                  {" "}
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>{" "}
                </a>
              )}{" "}
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="rounded-lg bg-white/5 p-2 text-muted transition hover:bg-[var(--primary)]/20 hover:text-[var(--primary)]"
                >
                  {" "}
                  <Mail className="h-5 w-5" />{" "}
                </a>
              )}{" "}
            </div>{" "}
          </div>{" "}
          {/* Quick Links */}{" "}
          <div>
            {" "}
            <h3 className="text-sm font-semibold text-main">
              {t("footer.quick_links")}
            </h3>{" "}
            <ul className="mt-4 space-y-2">
              {" "}
              <li>
                <Link
                  href="/products"
                  className="text-sm text-muted transition hover:text-[var(--primary)]"
                >
                  {t("nav.products")}
                </Link>
              </li>{" "}
              <li>
                <Link
                  href="/cart"
                  className="text-sm text-muted transition hover:text-[var(--primary)]"
                >
                  {t("nav.cart")}
                </Link>
              </li>{" "}
              <li>
                <Link
                  href="/deposit"
                  className="text-sm text-muted transition hover:text-[var(--primary)]"
                >
                  {t("nav.deposit")}
                </Link>
              </li>{" "}
              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-muted transition hover:text-[var(--primary)]"
                >
                  {t("nav.dashboard")}
                </Link>
              </li>{" "}
            </ul>{" "}
          </div>{" "}
          {/* Categories */}{" "}
          <div>
            {" "}
            <h3 className="text-sm font-semibold text-main">
              {t("footer.categories")}
            </h3>{" "}
            <ul className="mt-4 space-y-2">
              {" "}
              <li>
                <Link
                  href="/products?type=SOFTWARE_KEY"
                  className="text-sm text-muted transition hover:text-[var(--primary)]"
                >
                  Key bản quyền
                </Link>
              </li>{" "}
              <li>
                <Link
                  href="/products?type=DIGITAL_ACCOUNT"
                  className="text-sm text-muted transition hover:text-[var(--primary)]"
                >
                  Tài khoản số
                </Link>
              </li>{" "}
              <li>
                <Link
                  href="/products?type=SOFTWARE_TOOL"
                  className="text-sm text-muted transition hover:text-[var(--primary)]"
                >
                  Phần mềm & Tool
                </Link>
              </li>{" "}
              <li>
                <Link
                  href="/products?type=SUBSCRIPTION"
                  className="text-sm text-muted transition hover:text-[var(--primary)]"
                >
                  Gói đăng ký
                </Link>
              </li>{" "}
            </ul>{" "}
          </div>{" "}
          {/* Contact */}{" "}
          <div>
            {" "}
            <h3 className="text-sm font-semibold text-main">
              {t("footer.contact")}
            </h3>{" "}
            <ul className="mt-4 space-y-3">
              {" "}
              {contact.email && (
                <li className="flex items-center gap-2 text-sm text-muted">
                  {" "}
                  <Mail className="h-4 w-4 text-[var(--primary)] text-neon-glow-sm" />{" "}
                  {contact.email}{" "}
                </li>
              )}{" "}
              {contact.phone && (
                <li className="flex items-center gap-2 text-sm text-muted">
                  {" "}
                  <Phone className="h-4 w-4 text-[var(--primary)] text-neon-glow-sm" />{" "}
                  {contact.phone}{" "}
                </li>
              )}{" "}
              <li className="flex items-center gap-2 text-sm text-muted">
                {" "}
                <MapPin className="h-4 w-4 text-[var(--primary)] text-neon-glow-sm" />{" "}
                Hà Nội, Việt Nam{" "}
              </li>{" "}
            </ul>{" "}
          </div>{" "}
        </div>{" "}
        <div className="mt-12 border-t border-divider pt-8 text-center">
          {" "}
          <p className="text-sm text-muted">
            {" "}
            © 2026 {settings.siteName || "DigitalShop"}. All rights
            reserved.{" "}
          </p>{" "}
        </div>{" "}
      </div>{" "}
    </footer>
  ) }

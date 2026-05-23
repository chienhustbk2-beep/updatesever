"use client";
import Link from "next/link"
export default function SiteName({
  settings,
  className = "",
}: {
  settings: Record<string, string>;
  className?: string }) {
  const name = settings.siteName || "DigitalShop";
  return (
    <Link href="/" className={`text-xl font-bold tracking-tight ${className}`}>
      {" "}
      <span className="text-divine-blue text-neon-glow-sm">{name}</span>{" "}
    </Link>
  ) }

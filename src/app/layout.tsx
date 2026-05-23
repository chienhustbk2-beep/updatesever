import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import AuthProvider from "@/components/AuthProvider";
import { UIElementsProvider } from "@/components/UIElementsProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ContactWidget from "@/components/layout/ContactWidget";
import ScrollToTop from "@/components/ScrollToTop";
import SiteCustomizationBar from "@/components/layout/SiteCustomizationBar";
import VisitorTracker from "@/components/VisitorTracker";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DigitalShop - Cửa Hàng Phần Mềm & Key Bản Quyền",
  description:
    "Mua bán phần mềm, key bản quyền, tài khoản số uy tín, kích hoạt tự động 24/7",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-main text-main">
        <ThemeProvider>
          <AuthProvider>
            <UIElementsProvider>
              <ScrollToTop />
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
              <ContactWidget />
              <VisitorTracker />
              <SiteCustomizationBar />
            </UIElementsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

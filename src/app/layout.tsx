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
import DepositNotification from "@/components/ui/DepositNotification";
import SessionTimer from "@/components/SessionTimer";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ChienHust Store - Cửa Hàng Phần Mềm & Key Bản Quyền",
    template: "%s | ChienHust Store",
  },
  description:
    "ChienHust Store - Cửa hàng phần mềm, key bản quyền và tài khoản số uy tín tại Việt Nam. Giao dịch tự động 24/7, bảo hành trọn đời, hỗ trợ tận tâm.",
  keywords: ["key bản quyền", "phần mềm", "tài khoản số", "Windows", "Office", "ChatGPT", "Spotify", "Netflix"],
  openGraph: {
    title: "ChienHust Store - Cửa Hàng Phần Mềm & Key Bản Quyền",
    description: "Mua key bản quyền, phần mềm và tài khoản số uy tín. Giao dịch tự động 24/7, bảo hành trọn đời.",
    siteName: "ChienHust Store",
    locale: "vi_VN",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
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
              <DepositNotification />
              <SessionTimer />
              <SiteCustomizationBar />
            </UIElementsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

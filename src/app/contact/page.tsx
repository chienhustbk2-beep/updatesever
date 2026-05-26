'use client';import Link from 'next/link';import { ArrowLeft, Mail, Phone, MessageCircle, ExternalLink } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-3xl px-4 py-12">
        <Link href="/login" className="mb-8 flex items-center gap-2 text-sm text-white/50 transition hover:text-teal-400">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Link>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 text-2xl font-bold text-white shadow-lg shadow-teal-500/30">C</div>
          <h1 className="text-2xl font-bold text-white">Liên hệ</h1>
          <p className="mt-2 text-sm text-white/50">Thông tin liên hệ hỗ trợ</p>
        </div>
        <div className="mt-10 grid gap-6 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl" style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
          <p className="text-sm text-white/70">Vui lòng liên hệ với chúng tôi qua các kênh dưới đây để được hỗ trợ nhanh nhất.</p>
          <a href="mailto:admin@chienhust.com" className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 text-white transition hover:border-teal-500/50 hover:bg-white/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/20"><Mail className="h-5 w-5 text-teal-400" /></div>
            <div><p className="font-medium">Email</p><p className="text-sm text-white/50">admin@chienhust.com</p></div>
            <ExternalLink className="ml-auto h-4 w-4 text-white/30" />
          </a>
          <a href="https://zalo.me/..." target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-white transition hover:border-blue-500/50 hover:bg-blue-500/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20"><MessageCircle className="h-5 w-5 text-blue-400" /></div>
            <div><p className="font-medium">Zalo</p><p className="text-sm text-white/50">Liên hệ qua Zalo</p></div>
            <ExternalLink className="ml-auto h-4 w-4 text-white/30" />
          </a>
          <Link href="/support" className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 text-white transition hover:border-teal-500/50 hover:bg-white/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20"><Phone className="h-5 w-5 text-purple-400" /></div>
            <div><p className="font-medium">Hỗ trợ Ticket</p><p className="text-sm text-white/50">Tạo ticket hỗ trợ</p></div>
            <ExternalLink className="ml-auto h-4 w-4 text-white/30" />
          </Link>
        </div>
        <p className="mt-8 text-center text-xs text-white/30">© 2026</p>
      </div>
    </div>
  )
}

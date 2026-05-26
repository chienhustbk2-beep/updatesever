'use client';import Link from 'next/link';import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 text-2xl font-bold text-white shadow-lg shadow-teal-500/30">P</div>
          <h1 className="text-2xl font-bold text-white">Chính sách bảo mật</h1>
          <p className="mt-2 text-sm text-white/50">Chính sách bảo mật thông tin cá nhân</p>
        </div>
        <div className="mt-10 space-y-6 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl" style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
          <section><h2 className="mb-4 text-lg font-bold text-white">1. Thông tin thu thập</h2><p className="text-sm leading-relaxed text-white/70">Chúng tôi thu thập thông tin bạn cung cấp khi đăng ký tài khoản: email, tên hiển thị. Bạn có thể truy cập ẩn danh mà không cần cung cấp thông tin.</p></section>
          <section><h2 className="mb-4 text-lg font-bold text-white">2. Mục đích sử dụng</h2><p className="text-sm leading-relaxed text-white/70">Dữ liệu được dùng để xác thực tài khoản, xử lý đơn hàng, cải thiện dịch vụ và hỗ trợ khách hàng.</p></section>
          <section><h2 className="mb-4 text-lg font-bold text-white">3. Chia sẻ thông tin</h2><p className="text-sm leading-relaxed text-white/70">Chúng tôi cam kết không bán, trao đổi thông tin cá nhân của bạn cho bên thứ ba, trừ khi có yêu cầu pháp lý.</p></section>
          <section><h2 className="mb-4 text-lg font-bold text-white">4. Bảo mật</h2><p className="text-sm leading-relaxed text-white/70">Chúng tôi áp dụng các biện pháp bảo mật SSL/TLS, mã hóa mật khẩu và kiểm soát truy cập để bảo vệ dữ liệu của bạn.</p></section>
          <section><h2 className="mb-4 text-lg font-bold text-white">5. Quyền của bạn</h2><p className="text-sm leading-relaxed text-white/70">Bạn có quyền truy cập, chỉnh sửa, xóa thông tin cá nhân bất kỳ lúc nào trong trang quản lý tài khoản hoặc liên hệ với chúng tôi.</p></section>
        </div>
        <p className="mt-8 text-center text-xs text-white/30">© {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}

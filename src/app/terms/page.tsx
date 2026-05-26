'use client';import Link from 'next/link';import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 py-12">
        <Link href="/login" className="mb-8 flex items-center gap-2 text-sm text-white/50 transition hover:text-teal-400">
          <ArrowLeft className="h-4 w-4" />
          Quay lại đăng nhập
        </Link>

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 text-2xl font-bold text-white shadow-lg shadow-teal-500/30">S</div>
          <h1 className="text-2xl font-bold text-white">Điều khoản & Chính sách</h1>
          <p className="mt-2 text-sm text-white/50">Điều khoản dịch vụ & Chính sách bảo mật</p>
        </div>

        <div className="mt-10 space-y-10 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl" style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
          {/* Privacy Policy */}
          <section>
            <h2 className="mb-6 text-lg font-bold text-white">Chính sách bảo mật</h2>
            <div className="space-y-6 text-sm leading-relaxed text-white/70">
              <div>
                <h3 className="mb-2 font-semibold text-white">1. Thông tin mà chúng tôi thu thập</h3>
                <p>Nhằm cung cấp dịch vụ và mang đến trải nghiệm tốt hơn cho tất cả người dùng, chúng tôi thu thập thông tin từ bạn khi bạn đăng ký trên trang web. Cụ thể, khi bạn tạo tài khoản, bạn cung cấp cho chúng tôi thông tin cá nhân bao gồm tên đăng nhập và địa chỉ email liên lạc.</p>
                <p className="mt-2">Tuy nhiên, bạn vẫn có thể truy cập trang web của chúng tôi một cách ẩn danh mà không cần tiết lộ bất kỳ thông tin nào.</p>
                <p className="mt-2">Về việc tùy chỉnh thông tin, bạn có thể tự chỉnh sửa một số thông tin cá nhân trong trang quản lý tài khoản. Nếu cần thay đổi email đăng nhập, bạn cần liên hệ với chúng tôi để được hỗ trợ.</p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-white">2. Mục đích thu thập thông tin</h3>
                <p>Chúng tôi sử dụng dữ liệu thu thập được cho các mục đích: xác định và xác thực tài khoản, cải thiện dịch vụ, chăm sóc khách hàng và nghiên cứu phát triển. Thông tin và tài khoản đăng ký của bạn sẽ được lưu trữ để bạn có thể gia hạn dịch vụ bất cứ lúc nào.</p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-white">3. Bảo mật thông tin</h3>
                <p>Chúng tôi rất coi trọng vấn đề bảo mật thông tin của người dùng. Vì vậy, chúng tôi không bán, trao đổi, hoặc sử dụng các hình thức thương mại khác đối với thông tin cá nhân của bạn.</p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-white">4. Lưu trữ thông tin</h3>
                <p>Chúng tôi cam kết chỉ lưu trữ những dữ liệu cần thiết để vận hành dịch vụ. Bạn có thể yêu cầu xóa dữ liệu hoặc xóa tài khoản bất cứ lúc nào.</p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-white">5. Xóa thông tin</h3>
                <p>Bạn hoàn toàn có thể yêu cầu xóa dữ liệu cá nhân và tài khoản của mình trên hệ thống của chúng tôi bằng cách liên hệ trực tiếp.</p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-white">6. Lưu ý</h3>
                <p>Chúng tôi có thể cần tiết lộ thông tin cá nhân trong các trường hợp đặc biệt liên quan đến pháp luật hoặc khi hành động của bạn vi phạm chính sách dịch vụ.</p>
              </div>
            </div>
          </section>

          <hr className="border-white/10" />

          {/* Terms of Service */}
          <section>
            <h2 className="mb-6 text-lg font-bold text-white">Điều khoản dịch vụ</h2>
            <div className="space-y-4 text-sm leading-relaxed text-white/70">
              <p>Chúng tôi cung cấp giải pháp công nghệ và dịch vụ thông qua nền tảng website. Giải pháp của chúng tôi mang tới những tiện ích, công cụ giúp tối ưu thời gian và nguồn lực trong việc quản lý và vận hành trên các nền tảng mạng xã hội.</p>
              <p>Bạn có thể sử dụng một số tính năng cơ bản miễn phí. Để sử dụng các chức năng nâng cao, bạn cần đăng ký gói dịch vụ trả phí tương ứng.</p>
              <p>Chúng tôi cam kết không lưu trữ bất kỳ dữ liệu quảng cáo hay tài sản quảng cáo nào của người dùng khi sử dụng sản phẩm của chúng tôi.</p>
            </div>
          </section>

          <hr className="border-white/10" />

          {/* Cookie Policy */}
          <section>
            <h2 className="mb-6 text-lg font-bold text-white">Chính sách Cookie</h2>
            <div className="space-y-4 text-sm leading-relaxed text-white/70">
              <p>Cookie là các tập tin văn bản chứa một lượng thông tin nhỏ được tải xuống thiết bị của bạn khi bạn truy cập trang web. Cookie giúp việc điều hướng hiệu quả hơn, ghi nhớ tùy chỉnh của bạn và cải thiện trải nghiệm người dùng.</p>
              <p>Chúng tôi sử dụng Cookie cần thiết cho hoạt động trên website, cho phép lưu trữ thông tin đăng nhập của bạn cho những lần truy cập tiếp theo và đảm bảo trải nghiệm tốt hơn.</p>
            </div>
          </section>

          <hr className="border-white/10" />

          {/* Disclaimer */}
          <section>
            <h2 className="mb-6 text-lg font-bold text-white">Tuyên bố miễn trừ trách nhiệm</h2>
            <div className="space-y-6 text-sm leading-relaxed text-white/70">
              <div>
                <h3 className="mb-2 font-semibold text-white">1. Phương thức thanh toán</h3>
                <p>Hình thức thanh toán hiện tại đã được ghi rõ trong phần nạp tiền trên trang web. Chúng tôi không chịu trách nhiệm với bất kỳ trường hợp nào không thanh toán qua hình thức và nội dung được quy định.</p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-white">2. Chính sách hoàn tiền</h3>
                <p>Khi bạn quyết định mua gói dịch vụ hoặc nạp tiền vào tài khoản, đồng nghĩa với việc bạn đồng ý với các thỏa thuận mua hàng của chúng tôi. Chúng tôi khuyến khích bạn tìm hiểu kỹ về gói dịch vụ hoặc liên hệ trực tiếp để được tư vấn trước khi quyết định.</p>
                <p className="mt-2 font-medium text-red-400">Đối với mọi giao dịch nạp tiền hoặc mua gói dịch vụ, chúng tôi không chấp nhận hoàn tiền dưới bất kỳ hình thức nào nhằm tránh các hành vi lợi dụng và đảm bảo không có sự lạm dụng chính sách.</p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-white">3. Sản phẩm mạo danh</h3>
                <p>Chúng tôi không chịu trách nhiệm đối với các rủi ro, hậu quả khi người dùng sử dụng các sản phẩm không phải do chúng tôi cung cấp. Mọi sản phẩm và dịch vụ chính thức chỉ được phân phối thông qua trang web của chúng tôi.</p>
              </div>
            </div>
          </section>
        </div>

        <p className="mt-8 text-center text-xs text-white/30">© {new Date().getFullYear()}. Cập nhật lần cuối: 24/05/2026</p>
      </div>
    </div>
  )
}
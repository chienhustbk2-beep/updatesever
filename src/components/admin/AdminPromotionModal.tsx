'use client';import { X, Check, Minus, ExternalLink, Tag } from 'lucide-react';

const sampleData = [
  { program: 'Ưu Đãi Hợp Tác MMO x MOMA', code: 'MOMAMMO20', discount: '20% + Công cụ', active: true, used: '150', total: '500' },
  { program: 'TẠP HÓA MMO - Giảm Sốc Cuối Năm', code: 'THMMO50', discount: '50% Đơn Hàng', active: true, used: '328', total: '1000' },
  { program: 'MOMA SOLUTION - Ưu Đãi Đối Tác', code: 'MOMAPARTNER', discount: '30% + Quà Tặng', active: false, used: '45', total: '200' },
  { program: 'Khách Hàng Thân Thiết - Tháng 5', code: 'VIP052025', discount: '15% Tất Cả', active: false, used: '12', total: '100' },
]

export default function AdminPromotionModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* HEADER: gray-100 background, title left, X right */}
        <div className="flex items-center justify-between bg-gray-100 px-6 py-4">
          <h2 className="text-base font-bold tracking-wide text-gray-800">QUẢN LÝ KHUYẾN MÃI</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* BODY: table with sample data */}
        <div className="px-6 py-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Tên Chương Trình</th>
                <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Mã Code</th>
                <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Giảm Giá</th>
                <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Trạng Thái</th>
                <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Đã Dùng</th>
              </tr>
            </thead>
            <tbody>
              {sampleData.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="py-3.5 pr-4 text-gray-700 font-medium">{row.program}</td>
                  <td className="py-3.5 pr-4">
                    <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-xs font-mono font-semibold text-orange-700">{row.code}</span>
                  </td>
                  <td className="py-3.5 pr-4 text-gray-700">{row.discount}</td>
                  <td className="py-3.5 pr-4">
                    {row.active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                        <Check className="h-3.5 w-3.5" /> Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600">
                        <Minus className="h-3.5 w-3.5" /> Tạm dừng
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 text-right text-gray-600">
                    <span className="font-medium text-gray-700">{row.used}</span>
                    <span className="text-gray-600">/{row.total}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER: white bg, two buttons */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4">
          <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700">
            <Tag className="h-4 w-4" />
            Quản lý mã
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700">
            Xem chi tiết ưu đãi
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
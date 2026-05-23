import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  stock: number;
  status: string;
  type: string;
  _count: { productKeys: number };
  category: { name: string } | null
}

interface AdminProductListProps {
  products: Product[]
}

export default function AdminProductList({ products }: AdminProductListProps) {
  const typeLabels: Record<string, string> = {
    SOFTWARE_KEY: 'Key bản quyền',
    DIGITAL_ACCOUNT: 'Tài khoản số',
    SOFTWARE_TOOL: 'Phần mềm',
    LICENSE_KEY: 'License Key',
    SUBSCRIPTION: 'Gói đăng ký',
  };

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Hiển thị',
    DRAFT: 'Nháp',
    OUT_OF_STOCK: 'Hết hàng',
    HIDDEN: 'Ẩn',
  };

  return (
    <div className="rounded-xl border border-divider bg-card">
      <div className="border-b border-divider px-6 py-4">
        <h2 className="text-lg font-semibold text-main">
          Danh sách sản phẩm ({products.length})
        </h2>
      </div>
      {products.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-muted">Chưa có sản phẩm nào</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead className="border-b border-divider bg-card"><tr>
            <th className="px-4 py-3 text-left font-medium text-muted">Tên</th>
            <th className="px-4 py-3 text-left font-medium text-muted">Giá</th>
            <th className="px-4 py-3 text-left font-medium text-muted">Kho</th>
            <th className="px-4 py-3 text-left font-medium text-muted">Loại</th>
            <th className="px-4 py-3 text-left font-medium text-muted">Trạng thái</th>
          </tr></thead><tbody className="divide-y divide-border-divider">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-hover">
                <td className="px-4 py-3">
                  <Link href={`/product/${product.slug}`} className="font-medium text-primary hover:text-primary">{product.name}</Link>
                  {product.category && <p className="text-xs text-muted">{product.category.name}</p>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {product.salePrice ? (
                    <span><span className="text-[var(--danger)] font-semibold">{product.salePrice.toLocaleString('vi-VN')}đ</span><span className="text-xs text-muted line-through ml-1">{product.price.toLocaleString('vi-VN')}đ</span></span>
                  ) : (
                    <span className="font-semibold text-main">{product.price.toLocaleString('vi-VN')}đ</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={product.stock > 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}>{product.stock}</span>
                  <span className="text-xs text-muted ml-1">/ {product._count.productKeys}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-xs text-muted">{typeLabels[product.type] || product.type}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                    product.status === 'ACTIVE'
                      ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20'
                      : product.status === 'DRAFT'
                      ? 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20'
                      : product.status === 'HIDDEN'
                      ? 'bg-hover text-muted border-divider'
                      : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20'
                  }`}>{statusLabels[product.status] || product.status}</span>
                </td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )}
    </div>
  )
}

'use client';import { useState } from 'react';import { useRouter } from 'next/navigation';import { ShoppingCart, Zap } from 'lucide-react';import CartModal from './CartModal';interface ProductActionsProps { product: { id: string; name: string; price: number; salePrice?: number | null; image?: string; stock: number; status: string; bulkDiscounts?: { minQty: number; discount: number }[]  }}
export default function ProductActions({ product }: ProductActionsProps) {  const router = useRouter();const [showModal, setShowModal] = useState(false);const isOutOfStock = product.stock <= 0 || product.status === 'OUT_OF_STOCK';return (    <>      <div className="mt-6 space-y-3">                <button
          onClick={() => setShowModal(true)}
          disabled={isOutOfStock}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-base font-bold !text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.02] transition-all disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ShoppingCart className="h-5 w-5" />
          {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
        </button>
        {!isOutOfStock && (
          <button
            onClick={() => setShowModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-base font-bold !text-white shadow-lg shadow-orange-300 hover:shadow-xl hover:scale-105 transition-all"
          >
            <Zap className="h-5 w-5" />
            Mua ngay
          </button>
        )}      </div>      <CartModal        product={{          ...product,          bulkDiscounts: product.bulkDiscounts,        }}        isOpen={showModal}        onClose={() => setShowModal(false)}      />    </>  )}
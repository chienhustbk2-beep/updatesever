'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { Check, ShoppingCart } from 'lucide-react';

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    salePrice?: number | null;
    images: string;
    stock: number;
    status: string;
    bulkDiscounts?: { minQty: number; discount: number }[];
  };
  variant?: 'default' | 'compact';
}

export default function AddToCartButton({ product, variant = 'default' }: AddToCartButtonProps) {
  const addToCart = useCartStore((state) => state.addToCart);
  const [added, setAdded] = useState(false);
  const isOutOfStock = product.stock <= 0 || product.status === 'OUT_OF_STOCK';

  const getImageUrl = (): string | undefined => {
    if (!product.images) return undefined;
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      return product.images;
    } catch {
      return product.images;
    }
  };

  const imageUrl = getImageUrl();

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice ?? undefined,
      image: imageUrl || undefined,
      quantity: 1,
      bulkDiscounts: product.bulkDiscounts,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold !text-white shadow-md transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
          added ? 'bg-[var(--success)]' : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg'
        }`}
      >
        {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
        {added ? 'Đã thêm' : 'Thêm giỏ'}
      </button>
    );
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={isOutOfStock}
      className={`flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-base font-semibold !text-white shadow-md transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
        added
          ? 'bg-[var(--success)] hover:bg-[var(--success)]'
          : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg'
      }`}
    >
      {added ? (
        <>
          <Check className="h-5 w-5" />
          Đã thêm vào giỏ!
        </>
      ) : (
        <>
          <ShoppingCart className="h-5 w-5" />
          {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
        </>
      )}
    </button>
  );
}

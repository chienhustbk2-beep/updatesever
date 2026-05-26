import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProductActions from "@/components/ui/ProductActions";
import TabsSection from "@/components/ui/ProductTabs";
import { Shield, Zap, CheckCircle, Star } from "lucide-react";

interface ProductDetailPageProps { params: Promise<{ slug: string }> };async function getProduct(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      reviews: { include: { user: { select: { name: true } } } },
      bulkDiscounts: true,
    },
  });
  if (!product) return null;
  const availableKeyCount = await prisma.productKey.count({
    where: { productId: product.id, status: "AVAILABLE" },
  });
  return { ...product, stock: availableKeyCount };}
export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.price - (product.salePrice ?? product.price)) /
          product.price) *
          100,
      )
    : 0;
  const displayPrice = product.salePrice ?? product.price;
  const isOutOfStock = product.stock <= 0 || product.status === "OUT_OF_STOCK";

  const getImageUrl = (images: string | null): string | undefined => {
    if (!images) return undefined;
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      return images } catch {
      return images }
  }
const imageUrl = getImageUrl(product.images);
  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
        product.reviews.length
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted">
        <Link href="/" className="hover:text-divine-blue">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        {product.category && (
          <>
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-divine-blue"
            >
              {product.category.name}
            </Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-white">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left: Image */}
        <div className="relative aspect-video overflow-hidden rounded-xl bg-[var(--bg-card-alt)] card-gradient">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="h-full w-full object-scale-down"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">
              <span className="text-lg">Không có hình ảnh</span>
            </div>
          )}
          {hasDiscount && discountPercent > 0 && (
            <span className="absolute right-4 top-4 rounded-full bg-divine-red box-neon-glow px-3 py-1.5 text-sm font-bold text-white">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Right: Product Info */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-main sm:text-3xl">
            {product.name}
          </h1>

          {/* Rating */}
          {product.reviews.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${star <= Math.round(avgRating) ? "fill-[var(--warning)] text-[var(--warning)]" : "text-muted"}`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted">
                {avgRating.toFixed(1)} ({product.reviews.length} đánh giá)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-divine-blue text-neon-glow">
              {displayPrice.toLocaleString("vi-VN")}đ
            </span>
            {hasDiscount && (
              <span className="text-lg text-muted line-through">
                {product.price.toLocaleString("vi-VN")}đ
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="mt-3 flex items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full ${isOutOfStock ? "bg-[var(--danger)]" : "bg-[var(--success)]"}`}
            />
            <span
              className={`text-sm font-medium ${isOutOfStock ? "text-[var(--danger)]" : "text-[var(--success)]"}`}
            >
              {isOutOfStock ? "Hết hàng" : `Còn ${product.stock} key`}
            </span>
          </div>

          {/* Short Description */}
          {product.shortDesc && (
            <p className="mt-4 text-sm text-muted">{product.shortDesc}</p>
          )}

          {/* Benefits */}
          <div className="mt-6 rounded-lg border border-divider card-gradient p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Cam kết</h3>
            <ul className="space-y-2">
              {[
                "Key bản quyền chính hãng 100%",
                "Giao key tự động ngay sau thanh toán",
                "Bảo hành trong suốt thời gian sử dụng",
                "Hỗ trợ cài đặt 24/7",
              ].map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2 text-sm text-muted"
                >
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <ProductActions
            product={{
              id: product.id,
              name: product.name,
              price: product.price,
              salePrice: product.salePrice,
              image: imageUrl,
              stock: product.stock,
              status: product.status,
              bulkDiscounts: product.bulkDiscounts,
            }}
          />

          {/* Trust badges */}
          <div className="mt-6 flex items-center gap-6 text-sm text-muted">
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-divine-blue" />
              <span>Thanh toán an toàn</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-divine-blue" />
              <span>Giao ngay</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-12">
        <TabsSection product={product} />
      </div>
    </div>
  ) }

import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ui/ProductCard";
import HeroBanner from "@/components/ui/HeroBanner";
import {
  WhyChooseUs,
  TrustBadges,
  FeaturedSection,
} from "@/components/home/HomePageContent";
import HomeSearchBar from "@/components/home/HomeSearchBar";
import { Package } from "lucide-react";
async function getHomeData() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { bulkDiscounts: true },
    }),
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: "asc" },
      take: 6,
    }),
  ]);
  return { products, categories }}
export default async function HomePage() {
  const { products, categories } = await getHomeData();
  return (
    <>
      {" "}
      <HomeSearchBar categories={categories} /> <HeroBanner />{" "}
      <FeaturedSection>
        {" "}
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-divider py-24">
            {" "}
            <Package className="mb-4 h-16 w-16 text-muted" />{" "}
            <p className="text-lg font-medium text-muted">
              Chưa có sản phẩm nào
            </p>{" "}
            <p className="mt-1 text-sm text-muted">
              Quay lại sau để xem sản phẩm mới nhất
            </p>{" "}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {" "}
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: product.price,
                  salePrice: product.salePrice,
                  images: product.images,
                  stock: product.stock,
                  status: product.status,
                  bulkDiscounts: product.bulkDiscounts,
                }}
              />
            ))}{" "}
          </div>
        )}{" "}
      </FeaturedSection>{" "}
      <WhyChooseUs /> <TrustBadges />{" "}
    </>
  ) }

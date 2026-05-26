import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ui/ProductCard";
import HeroBanner from "@/components/ui/HeroBanner";
import {
  WhyChooseUs,
  TrustBadges,
  FeaturedSection,
} from "@/components/home/HomePageContent";
import HomeSearchBar from "@/components/home/HomeSearchBar";
import NotificationBar from "@/components/home/NotificationBar";
import PromoPopup from "@/components/home/PromoPopup";
import { Package } from "lucide-react";

export const dynamic = "force-dynamic";

async function getHomeData() {
  const [products, categories, availableGroups, settings] = await Promise.all([
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
    prisma.productKey.groupBy({
      by: ["productId"],
      _count: { id: true },
      where: { status: "AVAILABLE" },
    }),
    prisma.systemSettings.findMany({
      where: { key: { in: ["homepage_announcement_enabled", "homepage_announcement_content"] } },
    }),
  ]);
  const availableMap = new Map(availableGroups.map(g => [g.productId, g._count.id]));
  const productsSynced = products.map(p => ({
    ...p,
    stock: availableMap.get(p.id) ?? 0,
  }));
  const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));
  return { products: productsSynced, categories, settings: settingsMap }}
export default async function HomePage() {
  const { products, categories, settings } = await getHomeData();
  const announcementEnabled = settings?.homepage_announcement_enabled === 'true';
  const announcementContent = settings?.homepage_announcement_content || '';
  return (
    <>
      {announcementEnabled && announcementContent && (
        <div className="bg-gradient-to-r from-[var(--primary)]/10 via-[var(--primary)]/5 to-transparent border-b border-[var(--primary)]/10">
          <div className="mx-auto max-w-7xl px-4 py-3 text-sm text-main prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: announcementContent }} />
        </div>
      )}
      {" "}
      <HomeSearchBar categories={categories} /> <HeroBanner />{" "}
      <NotificationBar />{" "}
      <PromoPopup />{" "}
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
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
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

import { prisma } from "@/lib/prisma";
import AdminKeysImport from "@/components/admin/AdminKeysImport";
async function getData() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ where: { NOT: { slug: { startsWith: "deleted-" } } }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { products, categories };}
export default async function AdminKeysPage() {
  const { products, categories } = await getData();
  return <AdminKeysImport products={products} categories={categories} /> }

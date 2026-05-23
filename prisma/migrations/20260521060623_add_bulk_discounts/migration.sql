-- CreateTable
CREATE TABLE "bulk_discounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "minQty" INTEGER NOT NULL,
    "discount" REAL NOT NULL,
    CONSTRAINT "bulk_discounts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "bulk_discounts_productId_minQty_key" ON "bulk_discounts"("productId", "minQty");

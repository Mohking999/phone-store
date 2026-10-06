CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE "StockStatus" AS ENUM ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK');
CREATE TYPE "DeliveryType" AS ENUM ('HOME', 'STOPDESK');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'RETURNED');
CREATE TYPE "AdminRole" AS ENUM ('SUPERADMIN', 'STAFF');

CREATE TABLE "Brand" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "logoUrl" TEXT,
  "isPopular" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

CREATE TABLE "PhoneModel" (
  "id" TEXT NOT NULL,
  "brandId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "releaseYear" INTEGER,
  "aliases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "isPopular" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PhoneModel_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PhoneModel_slug_key" ON "PhoneModel"("slug");
CREATE UNIQUE INDEX "PhoneModel_brandId_name_key" ON "PhoneModel"("brandId", "name");
CREATE INDEX "PhoneModel_brandId_idx" ON "PhoneModel"("brandId");
CREATE INDEX "PhoneModel_name_idx" ON "PhoneModel"("name");
CREATE INDEX "PhoneModel_name_trgm_idx" ON "PhoneModel" USING GIN ("name" gin_trgm_ops);

CREATE TABLE "Category" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "nameAr" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "icon" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "descriptionAr" TEXT,
  "priceDzd" INTEGER NOT NULL,
  "comparePriceDzd" INTEGER,
  "stockQuantity" INTEGER NOT NULL DEFAULT 0,
  "stockStatus" "StockStatus" NOT NULL DEFAULT 'IN_STOCK',
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "isBestSeller" BOOLEAN NOT NULL DEFAULT false,
  "isNewArrival" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_sku_idx" ON "Product"("sku");
CREATE INDEX "Product_sku_trgm_idx" ON "Product" USING GIN ("sku" gin_trgm_ops);
CREATE INDEX "Product_stockStatus_idx" ON "Product"("stockStatus");
CREATE INDEX "Product_name_trgm_idx" ON "Product" USING GIN ("name" gin_trgm_ops);

CREATE TABLE "Image" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "alt" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Image_productId_idx" ON "Image"("productId");

CREATE TABLE "ProductCompatibility" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "phoneModelId" TEXT NOT NULL,
  CONSTRAINT "ProductCompatibility_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProductCompatibility_productId_phoneModelId_key" ON "ProductCompatibility"("productId", "phoneModelId");
CREATE INDEX "ProductCompatibility_phoneModelId_idx" ON "ProductCompatibility"("phoneModelId");
CREATE INDEX "ProductCompatibility_productId_idx" ON "ProductCompatibility"("productId");

CREATE TABLE "Review" (
  "id" TEXT NOT NULL,
  "productId" TEXT,
  "authorName" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "rating" INTEGER NOT NULL DEFAULT 5,
  "body" TEXT NOT NULL,
  "isApproved" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Review_isApproved_createdAt_idx" ON "Review"("isApproved", "createdAt");

CREATE TABLE "AdminUser" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "AdminRole" NOT NULL DEFAULT 'STAFF',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

CREATE TABLE "Order" (
  "id" TEXT NOT NULL,
  "orderNumber" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "wilayaCode" INTEGER NOT NULL,
  "wilaya" TEXT NOT NULL,
  "commune" TEXT NOT NULL,
  "deliveryType" "DeliveryType" NOT NULL,
  "deliveryFee" INTEGER NOT NULL,
  "totalDzd" INTEGER NOT NULL,
  "notes" TEXT,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" INTEGER NOT NULL,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

ALTER TABLE "PhoneModel" ADD CONSTRAINT "PhoneModel_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Image" ADD CONSTRAINT "Image_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductCompatibility" ADD CONSTRAINT "ProductCompatibility_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductCompatibility" ADD CONSTRAINT "ProductCompatibility_phoneModelId_fkey" FOREIGN KEY ("phoneModelId") REFERENCES "PhoneModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

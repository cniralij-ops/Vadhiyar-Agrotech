import { prisma } from "./prisma";

export async function ensureProductManagementSchema() {
  await prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`
      ALTER TABLE "Product"
      ADD COLUMN IF NOT EXISTS "isAvailable" BOOLEAN NOT NULL DEFAULT true
    `;
    await transaction.$executeRaw`
      ALTER TABLE "Product"
      ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false
    `;
    await transaction.$executeRaw`
      ALTER TABLE "Product"
      ADD COLUMN IF NOT EXISTS "isVisible" BOOLEAN NOT NULL DEFAULT true
    `;
    await transaction.$executeRaw`
      ALTER TABLE "Product"
      ALTER COLUMN "name" SET DEFAULT 'Untitled product'
    `;
    await transaction.$executeRaw`
      ALTER TABLE "Product"
      ALTER COLUMN "description" SET DEFAULT ''
    `;
    await transaction.$executeRaw`
      ALTER TABLE "Product"
      ALTER COLUMN "price" SET DEFAULT 0
    `;
    await transaction.$executeRaw`
      ALTER TABLE "Product"
      ALTER COLUMN "image" SET DEFAULT ''
    `;
    await transaction.$executeRaw`
      ALTER TABLE "Product"
      ALTER COLUMN "isAvailable" SET DEFAULT false
    `;
    await transaction.$executeRaw`
      ALTER TABLE "Product"
      ALTER COLUMN "isVisible" SET DEFAULT false
    `;
    await transaction.$executeRaw`
      ALTER TABLE "Product"
      ALTER COLUMN "categoryId" DROP NOT NULL
    `;
    await transaction.$executeRaw`
      CREATE TABLE IF NOT EXISTS "MediaAsset" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "mimeType" TEXT NOT NULL,
        "data" BYTEA NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
  });
}

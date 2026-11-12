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
      CREATE TABLE IF NOT EXISTS "MediaAsset" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "mimeType" TEXT NOT NULL,
        "data" BYTEA NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
  });
}

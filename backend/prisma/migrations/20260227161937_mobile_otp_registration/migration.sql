/*
  Warnings:

  - You are about to alter the column `consumed` on the `OtpRequest` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.
  - You are about to alter the column `verified` on the `OtpRequest` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CustomerProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "addressLine" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    CONSTRAINT "CustomerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CustomerProfile" ("addressLine", "city", "id", "state", "userId") SELECT "addressLine", "city", "id", "state", "userId" FROM "CustomerProfile";
DROP TABLE "CustomerProfile";
ALTER TABLE "new_CustomerProfile" RENAME TO "CustomerProfile";
CREATE UNIQUE INDEX "CustomerProfile_userId_key" ON "CustomerProfile"("userId");
CREATE TABLE "new_OtpRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_OtpRequest" ("codeHash", "consumed", "createdAt", "expiresAt", "id", "phone", "purpose", "token", "verified") SELECT "codeHash", "consumed", "createdAt", "expiresAt", "id", "phone", "purpose", "token", "verified" FROM "OtpRequest";
DROP TABLE "OtpRequest";
ALTER TABLE "new_OtpRequest" RENAME TO "OtpRequest";
CREATE UNIQUE INDEX "OtpRequest_token_key" ON "OtpRequest"("token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

import { prisma } from "./utils/prisma";
import { ensureProductManagementSchema } from "./utils/productSchema";

ensureProductManagementSchema()
  .then(() => console.log("Product-management database schema is ready"))
  .catch((error) => {
    console.error("Failed to deploy the product-management database schema", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

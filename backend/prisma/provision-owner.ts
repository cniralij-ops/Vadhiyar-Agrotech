import { PrismaClient } from "@prisma/client";
import { config } from "../src/config";
import { provisionOwner } from "./owner";

const prisma = new PrismaClient({
  datasources: { db: { url: config.databaseUrl } }
});

provisionOwner(prisma)
  .then(() => console.log("Owner account provisioned"))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

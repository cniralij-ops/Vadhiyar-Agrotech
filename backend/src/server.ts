import app from "./app";
import { config } from "./config";
import { prisma } from "./utils/prisma";
import { ensureProductManagementSchema } from "./utils/productSchema";

let server: ReturnType<typeof app.listen> | undefined;

const gracefulShutdown = async () => {
  await prisma.$disconnect();
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

ensureProductManagementSchema()
  .then(() => {
    server = app.listen(config.port, () => {
      console.log(`Backend listening on http://localhost:${config.port}`);
    });
  })
  .catch(async (error) => {
    console.error("Failed to prepare the product-management database schema", error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });

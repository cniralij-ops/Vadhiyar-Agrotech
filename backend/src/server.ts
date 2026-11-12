import app from "./app";
import { config } from "./config";
import { prisma } from "./utils/prisma";
import { provisionOwner } from "./utils/ownerProvision";
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

const start = async () => {
  await ensureProductManagementSchema();
  if (process.env.OWNER_PASSWORD) {
    await provisionOwner(prisma);
    console.log("Owner account provisioned");
  }
  server = app.listen(config.port, () => {
    console.log(`Backend listening on http://localhost:${config.port}`);
  });
};

start()
  .catch(async (error) => {
    console.error("Backend startup initialization failed", error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });

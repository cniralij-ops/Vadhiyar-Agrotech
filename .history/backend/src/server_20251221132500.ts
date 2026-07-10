import app from "./app";
import { config } from "./config";
import { prisma } from "./utils/prisma";

const server = app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
});

const gracefulShutdown = async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

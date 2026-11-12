import { prisma } from "./utils/prisma";
import { provisionOwner } from "./utils/ownerProvision";

provisionOwner(prisma)
  .then(() => console.log("Owner account provisioned"))
  .catch((error) => {
    console.error("Owner account provisioning failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

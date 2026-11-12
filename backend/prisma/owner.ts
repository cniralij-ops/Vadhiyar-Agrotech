import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function provisionOwner(prisma: PrismaClient) {
  const ownerPassword = process.env.OWNER_PASSWORD;
  if (!ownerPassword || ownerPassword.length < 14) {
    throw new Error("Set OWNER_PASSWORD to a value of at least 14 characters.");
  }

  const ownerEmail = (process.env.OWNER_EMAIL ?? "vadhiyaragro@gmail.com").trim().toLowerCase();
  const ownerName = (process.env.OWNER_NAME ?? "Jesangbhai Chaudhary").trim();
  const ownerPhone = (process.env.OWNER_PHONE ?? "9429480002").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
    throw new Error("OWNER_EMAIL must be a valid email address.");
  }
  if (ownerName.length < 2 || ownerPhone.length < 6) {
    throw new Error("OWNER_NAME and OWNER_PHONE must contain valid owner details.");
  }

  const existingOwner = await prisma.user.findUnique({ where: { email: ownerEmail } });
  const legacySeededAdmin = await prisma.user.findUnique({ where: { email: "cniralij@gmail.com" } });
  const accountToProvision = existingOwner ?? legacySeededAdmin;
  const phoneOwner = await prisma.user.findUnique({ where: { phone: ownerPhone } });
  if (phoneOwner && phoneOwner.id !== accountToProvision?.id) {
    throw new Error("OWNER_PHONE is already assigned to a different account.");
  }

  const hashedPassword = await bcrypt.hash(ownerPassword, 12);
  if (accountToProvision) {
    await prisma.user.update({
      where: { id: accountToProvision.id },
      data: { name: ownerName, email: ownerEmail, phone: ownerPhone, hashedPassword, role: "ADMIN" }
    });
  } else {
    await prisma.user.create({
      data: {
        name: ownerName,
        email: ownerEmail,
        phone: ownerPhone,
        hashedPassword,
        role: "ADMIN"
      }
    });
  }

  if (legacySeededAdmin && legacySeededAdmin.id !== accountToProvision?.id && legacySeededAdmin.role === "ADMIN") {
    await prisma.user.update({
      where: { id: legacySeededAdmin.id },
      data: { role: "CUSTOMER" }
    });
  }
}

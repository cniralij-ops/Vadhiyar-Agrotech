import express from "express";
import { prisma } from "../utils/prisma";
import { authenticate, requireRole } from "../middleware/auth";

const router = express.Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/", async (_req, res) => {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: { id: true, name: true, email: true, phone: true, createdAt: true }
  });
  res.json(customers);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const customer = await prisma.user.findUnique({
    where: { id: Number(id) },
    include: {
      orders: { include: { items: { include: { product: true } } } },
      loginHistory: { orderBy: { createdAt: "desc" }, take: 10 }
    }
  });
  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }
  res.json(customer);
});

export default router;

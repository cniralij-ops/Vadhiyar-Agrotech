import express from "express";
import { prisma } from "../utils/prisma";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";
import { orderSchema } from "../utils/validators";

const router = express.Router();

router.use(authenticate, requireRole("CUSTOMER"));

router.get("/", async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).end();
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" }
  });
  res.json(orders);
});

router.post("/", async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).end();
  const parse = orderSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: parse.error.flatten().fieldErrors });
  }
  const { items, fullName, mobile, email, address, city, state, pincode, notes } = parse.data;

  try {
    const productIds = items.map((item) => item.productId);
    const uniqueProductIds = Array.from(new Set(productIds));
    const products = await prisma.product.findMany({ where: { id: { in: uniqueProductIds } } });
    if (products.length !== uniqueProductIds.length) {
      return res.status(400).json({ message: "One or more products not found" });
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    const stockRequests = new Map<number, number>();
    for (const item of items) {
      stockRequests.set(item.productId, (stockRequests.get(item.productId) ?? 0) + item.quantity);
    }

    for (const [productId, requestedQty] of stockRequests.entries()) {
      const product = productMap.get(productId);
      if (!product) {
        throw new Error("One or more products not found");
      }
      if (!product.isVisible || !product.isAvailable) {
        throw new Error(`${product.name} is not available for ordering.`);
      }
      if (product.stock < requestedQty) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }
    }

    const orderItems = items.map((item) => {
      const product = productMap.get(item.productId)!;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price
      };
    });

    const total = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    const order = await prisma.$transaction(async (tx) => {
      for (const [productId, requestedQty] of stockRequests.entries()) {
        const result = await tx.product.updateMany({
          where: { id: productId, isVisible: true, isAvailable: true, stock: { gte: requestedQty } },
          data: { stock: { decrement: requestedQty } }
        });
        if (result.count === 0) {
          const product = productMap.get(productId);
          throw new Error(
            product ? `${product.name} is no longer in stock for the requested quantity.` : "Product unavailable"
          );
        }
      }
      const created = await tx.order.create({
        data: {
          userId: req.user!.id,
          total,
          fullName,
          mobile,
          email,
          address,
          city,
          state,
          pincode,
          notes,
          items: {
            create: orderItems
          }
        },
        include: { items: true }
      });
      return created;
    });
    res.status(201).json(order);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
});

export default router;

import express, { NextFunction, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { authenticate, requireRole } from "../middleware/auth";
import { productSchema, productUpdateSchema, orderStatusSchema } from "../utils/validators";
import { withParsedGallery, withParsedGalleryList } from "../utils/product";
import multer, { Options } from "multer";
import fs from "fs";
import path from "path";

const router = express.Router();

const galleryDir = path.resolve(__dirname, "..", "..", "uploads", "gallery");
fs.mkdirSync(galleryDir, { recursive: true });
const galleryStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) =>
    cb(null, galleryDir),
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const safeName = file.originalname.replace(/[^a-z0-9\.\-]+/gi, "_");
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`);
  }
});
const galleryUpload = multer({ storage: galleryStorage });

const serializeGallery = (gallery?: string[]) => JSON.stringify(gallery ?? []);

router.use(authenticate, requireRole("ADMIN"));

router.get("/dashboard", async (_req, res) => {
  const customerCount = await prisma.user.count({ where: { role: "CUSTOMER" } });
  const orders = await prisma.order.findMany({});
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  res.json({
    totalCustomers: customerCount,
    totalOrders: orders.length,
    totalRevenue,
    recentActivity: await prisma.loginHistory.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } }
    })
  });
});

router.get("/orders", async (_req, res) => {
  const orders = await prisma.order.findMany({
    include: {
      user: true,
      items: { include: { product: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  const normalized = orders.map((order) => ({
    ...order,
    items: order.items.map((item) => ({
      ...item,
      product: withParsedGallery(item.product)
    }))
  }));
  res.json(normalized);
});

router.put("/orders/:id/status", async (req, res) => {
  const parse = orderStatusSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: "Invalid status" });
  }
  const { id } = req.params;
  try {
    const order = await prisma.order.update({
      where: { id: Number(id) },
      data: { status: parse.data.status }
    });
    res.json(order);
  } catch (error) {
    res.status(404).json({ message: "Order not found" });
  }
});

router.get("/products", async (_req, res) => {
  const products = await prisma.product.findMany({ include: { category: true } });
  res.json(withParsedGalleryList(products));
});

router.post(
  "/products/gallery",
  galleryUpload.array("gallery", 10),
  async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }
    const baseUrl = `${req.protocol}://${req.get("host")}/uploads/gallery`;
    const urls = files.map((file) => `${baseUrl}/${file.filename}`);
    res.status(201).json({ urls });
  }
);

router.post("/products", async (req, res) => {
  const parse = productSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: parse.error.flatten().fieldErrors });
  }
  const payload = parse.data;
  const product = await prisma.product.create({
    data: {
      name: payload.name,
      slug: payload.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
      description: payload.description,
      price: payload.price,
      stock: payload.stock,
      image: payload.image,
      gallery: serializeGallery(payload.gallery),
      category: { connect: { id: payload.categoryId } }
    }
  });
  res.status(201).json(withParsedGallery(product));
});

router.put("/products/:id", async (req, res) => {
  const parse = productUpdateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: parse.error.flatten().fieldErrors });
  }
  const { id } = req.params;
  try {
    const updateData: Record<string, unknown> = { ...parse.data };
    if (Object.prototype.hasOwnProperty.call(parse.data, "gallery")) {
      updateData.gallery = serializeGallery(parse.data.gallery ?? []);
    }
    const product = await prisma.product.update({
      where: { id: Number(id) },
      data: updateData
    });
    res.json(withParsedGallery(product));
  } catch (error) {
    res.status(404).json({ message: "Product not found" });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (error) {
    res.status(404).json({ message: "Product not found" });
  }
});

export default router;

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

const ACCEPTED_IMAGE_MIME_TYPES = new Set<string>(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

const imageOnlyFilter: Options["fileFilter"] = (_req, file, cb) => {
  if (ACCEPTED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG, or WEBP images are allowed."));
  }
};

const upload = multer({ storage: galleryStorage, fileFilter: imageOnlyFilter });

const handleUploadErrors = (uploadHandler: express.RequestHandler) =>
  (req: Request, res: Response, next: NextFunction) => {
    uploadHandler(req, res, (error?: unknown) => {
      if (error) {
        return res.status(400).json({ message: error instanceof Error ? error.message : "File upload failed" });
      }
      next();
    });
  };

const uploadGalleryMiddleware = handleUploadErrors(upload.array("gallery", 10));
const uploadProductImageMiddleware = handleUploadErrors(upload.single("image"));

const buildImageUrl = (_req: Request, filename: string) =>
  `https://vadhiyar-agrotech.onrender.com/uploads/gallery/${filename}`;

const parseGalleryField = (raw: unknown): string[] | undefined => {
  if (typeof raw === "undefined") {
    return undefined;
  }
  if (typeof raw === "string") {
    if (!raw.trim()) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
        return parsed;
      }
    } catch (_error) {
      throw new Error("Invalid gallery payload");
    }
    throw new Error("Invalid gallery payload");
  }
  if (Array.isArray(raw) && raw.every((item) => typeof item === "string")) {
    return raw as string[];
  }
  throw new Error("Invalid gallery payload");
};

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

router.post("/products/gallery", uploadGalleryMiddleware, async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }
  const baseUrl = "https://vadhiyar-agrotech.onrender.com/uploads/gallery";
  const urls = files.map((file) => `${baseUrl}/${file.filename}`);
  res.status(201).json({ urls });
});

router.post("/products", uploadProductImageMiddleware, async (req, res) => {
  let galleryList: string[] = [];
  try {
    galleryList = parseGalleryField(req.body.gallery) ?? [];
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }

  let imageUrl: string | undefined;
  if (req.file) {
    imageUrl = buildImageUrl(req, req.file.filename);
  } else if (typeof req.body.image === "string" && req.body.image.trim().length > 0) {
    imageUrl = req.body.image.trim();
  }

  if (!imageUrl) {
    return res.status(400).json({ message: "Product image is required" });
  }

  const payload = {
    name: req.body.name,
    description: req.body.description,
    price: Number(req.body.price),
    stock: Number(req.body.stock),
    image: imageUrl,
    categoryId: Number(req.body.categoryId),
    gallery: galleryList
  };

  const parse = productSchema.safeParse(payload);
  if (!parse.success) {
    return res.status(400).json({ message: parse.error.flatten().fieldErrors });
  }

  try {
    const product = await prisma.product.create({
      data: {
        name: parse.data.name,
        slug: parse.data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
        description: parse.data.description,
        price: parse.data.price,
        stock: parse.data.stock,
        image: parse.data.image,
        gallery: serializeGallery(parse.data.gallery),
        category: { connect: { id: parse.data.categoryId } }
      }
    });
    res.status(201).json(withParsedGallery(product));
  } catch (error) {
    res.status(500).json({ message: "Failed to create product" });
  }
});

router.put("/products/:id", uploadProductImageMiddleware, async (req, res) => {
  const { id } = req.params;

  let galleryList: string[] | undefined;
  try {
    if (typeof req.body.gallery !== "undefined") {
      galleryList = parseGalleryField(req.body.gallery);
    }
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }

  let imageUrl: string | undefined;
  if (req.file) {
    imageUrl = buildImageUrl(req, req.file.filename);
  } else if (typeof req.body.image === "string" && req.body.image.trim().length > 0) {
    imageUrl = req.body.image.trim();
  }

  const payload: Record<string, unknown> = {};
  if (typeof req.body.name !== "undefined") payload.name = req.body.name;
  if (typeof req.body.description !== "undefined") payload.description = req.body.description;
  if (typeof req.body.price !== "undefined") payload.price = Number(req.body.price);
  if (typeof req.body.stock !== "undefined") payload.stock = Number(req.body.stock);
  if (typeof req.body.categoryId !== "undefined") payload.categoryId = Number(req.body.categoryId);
  if (typeof imageUrl !== "undefined") payload.image = imageUrl;
  if (typeof galleryList !== "undefined") payload.gallery = galleryList;

  const parse = productUpdateSchema.safeParse(payload);
  if (!parse.success) {
    return res.status(400).json({ message: parse.error.flatten().fieldErrors });
  }

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

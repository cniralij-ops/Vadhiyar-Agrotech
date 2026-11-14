import express, { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth";
import { config } from "../config";
import { productSchema, productUpdateSchema, orderStatusSchema } from "../utils/validators";
import { withParsedGallery, withParsedGalleryList } from "../utils/product";
import multer, { Options } from "multer";

const router = express.Router();

const requireOwner: express.RequestHandler = (req: AuthRequest, res, next) => {
  if (!req.user || req.user.email.toLowerCase() !== config.ownerEmail) {
    return res.status(403).json({ message: "Owner access required" });
  }
  next();
};

const ACCEPTED_IMAGE_MIME_TYPES = new Set<string>(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

const imageOnlyFilter: Options["fileFilter"] = (_req, file, cb) => {
  if (ACCEPTED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG, or WEBP images are allowed."));
  }
};

const hasValidImageSignature = (file: Express.Multer.File) => {
  const buffer = file.buffer;
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (file.mimetype === "image/png") {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (file.mimetype === "image/webp") {
    return buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  }
  return false;
};

const normalizeMimeType = (mimeType: string) => mimeType === "image/jpg" ? "image/jpeg" : mimeType;

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageOnlyFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 }
});

const handleUploadErrors = (uploadHandler: express.RequestHandler) =>
  (req: Request, res: Response, next: NextFunction) => {
    uploadHandler(req, res, (error?: unknown) => {
      if (error) {
        return res.status(400).json({ message: error instanceof Error ? error.message : "File upload failed" });
      }
      const files = req.file ? [req.file] : Array.isArray(req.files) ? req.files : [];
      if (files.some((file) => !hasValidImageSignature(file))) {
        return res.status(400).json({ message: "The uploaded file is not a valid JPG, PNG, or WEBP image." });
      }
      next();
    });
  };

const uploadGalleryMiddleware = handleUploadErrors(upload.array("gallery", 10));
const uploadProductImageMiddleware = handleUploadErrors(upload.single("image"));

const buildImageUrl = (req: Request, assetId: string) => {
  const protocol = req.get("x-forwarded-proto")?.split(",")[0] ?? req.protocol;
  return `${protocol}://${req.get("host")}/api/products/images/${assetId}`;
};

const saveImageAsset = async (req: Request, file: Express.Multer.File) => {
  const asset = await prisma.mediaAsset.create({
    data: { mimeType: normalizeMimeType(file.mimetype), data: file.buffer }
  });
  return buildImageUrl(req, asset.id);
};

const normalizeImageUrl = (image: string) => {
  if (!image) return image;

  return image
    .replace(
      /^http:\/\/localhost:4000\/uploads\/gallery/i,
      "https://vadhiyar-agrotech.onrender.com/uploads/gallery"
    )
    .replace(
      /^https?:\/\/127\.0\.0\.1:4000\/uploads\/gallery/i,
      "https://vadhiyar-agrotech.onrender.com/uploads/gallery"
    );
};

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

const normalizeBoolean = (value: unknown) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
};

const normalizeProductText = (value: unknown, fallback: string) => {
  if (typeof value === "undefined") return fallback;
  return typeof value === "string" ? value.trim() || fallback : value;
};

const normalizeProductNumber = (value: unknown, fallback: number) =>
  value === null || typeof value === "undefined" || (typeof value === "string" && !value.trim())
    ? fallback
    : Number(value);

const normalizeCategoryId = (value: unknown) =>
  value === null || typeof value === "undefined" || (typeof value === "string" && !value.trim())
    ? null
    : Number(value);

const hasLegacyProductDetails = (body: Record<string, unknown>) =>
  typeof body.name === "string" &&
  body.name.trim().length >= 3 &&
  typeof body.description === "string" &&
  body.description.trim().length >= 10 &&
  normalizeProductNumber(body.price, 0) > 0 &&
  normalizeCategoryId(body.categoryId) !== null;

const isKnownPrismaError = (error: unknown): error is Prisma.PrismaClientKnownRequestError =>
  error instanceof Prisma.PrismaClientKnownRequestError;

const createProductSlug = async (name: string) => {
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "product";
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.product.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  return slug;
};

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

router.get("/products", requireOwner, async (_req, res) => {
  const products = await prisma.product.findMany({ include: { category: true } });
  res.json(withParsedGalleryList(products));
});

router.post("/products/gallery", requireOwner, uploadGalleryMiddleware, async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }
  try {
    const urls = await Promise.all(files.map((file) => saveImageAsset(req, file)));
    res.status(201).json({ urls });
  } catch (error) {
    console.error("Failed to store product images", error);
    res.status(500).json({ message: "Failed to store product images" });
  }
});

router.post("/products", requireOwner, uploadProductImageMiddleware, async (req, res) => {
  let galleryList: string[] = [];
  try {
    galleryList = parseGalleryField(req.body.gallery) ?? [];
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }

  const defaultListingState = hasLegacyProductDetails(req.body);
  const payload = {
    name: normalizeProductText(req.body.name, "Untitled product"),
    description: normalizeProductText(req.body.description, ""),
    price: normalizeProductNumber(req.body.price, 0),
    stock: normalizeProductNumber(req.body.stock, 0),
    image: typeof req.body.image === "string" ? normalizeImageUrl(req.body.image.trim()) : "",
    categoryId: normalizeCategoryId(req.body.categoryId),
    gallery: galleryList,
    ...(typeof req.body.isAvailable === "undefined"
      ? { isAvailable: defaultListingState }
      : { isAvailable: normalizeBoolean(req.body.isAvailable) }),
    ...(typeof req.body.isFeatured === "undefined"
      ? {}
      : { isFeatured: normalizeBoolean(req.body.isFeatured) }),
    ...(typeof req.body.isVisible === "undefined"
      ? { isVisible: defaultListingState }
      : { isVisible: normalizeBoolean(req.body.isVisible) })
  };

  const parse = productSchema.safeParse(payload);
  if (!parse.success) {
    return res.status(400).json({ message: parse.error.flatten().fieldErrors });
  }

  try {
    if (parse.data.categoryId !== null) {
      const category = await prisma.category.findUnique({
        where: { id: parse.data.categoryId },
        select: { id: true }
      });
      if (!category) {
        return res.status(400).json({ message: "Category not found" });
      }
    }
    const imageUrl = req.file ? await saveImageAsset(req, req.file) : parse.data.image;
    const product = await prisma.product.create({
      data: {
        name: parse.data.name,
        slug: await createProductSlug(parse.data.name),
        description: parse.data.description,
        price: parse.data.price,
        stock: parse.data.stock,
        image: imageUrl,
        gallery: serializeGallery(parse.data.gallery),
        isAvailable: parse.data.isAvailable,
        isFeatured: parse.data.isFeatured,
        isVisible: parse.data.isVisible,
        ...(parse.data.categoryId === null
          ? {}
          : { category: { connect: { id: parse.data.categoryId } } })
      }
    });
    res.status(201).json(withParsedGallery(product));
  } catch (error) {
    if (isKnownPrismaError(error) && error.code === "P2002") {
      return res.status(409).json({ message: "A product with this name already exists." });
    }
    console.error("Failed to create product", error);
    res.status(500).json({ message: "Failed to create product" });
  }
});

router.put("/products/:id", requireOwner, uploadProductImageMiddleware, async (req, res) => {
  const { id } = req.params;

  let galleryList: string[] | undefined;
  try {
    if (typeof req.body.gallery !== "undefined") {
      galleryList = parseGalleryField(req.body.gallery);
    }
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }

  const payload: Record<string, unknown> = {};
  if (typeof req.body.name !== "undefined") payload.name = normalizeProductText(req.body.name, "Untitled product");
  if (typeof req.body.description !== "undefined") payload.description = normalizeProductText(req.body.description, "");
  if (typeof req.body.price !== "undefined") payload.price = normalizeProductNumber(req.body.price, 0);
  if (typeof req.body.stock !== "undefined") payload.stock = normalizeProductNumber(req.body.stock, 0);
  if (typeof req.body.categoryId !== "undefined") payload.categoryId = normalizeCategoryId(req.body.categoryId);
  if (typeof req.body.image === "string") payload.image = normalizeImageUrl(req.body.image.trim());
  if (typeof galleryList !== "undefined") payload.gallery = galleryList;
  for (const field of ["isAvailable", "isFeatured", "isVisible"] as const) {
    if (typeof req.body[field] !== "undefined") payload[field] = normalizeBoolean(req.body[field]);
  }

  const parse = productUpdateSchema.safeParse(payload);
  if (!parse.success) {
    return res.status(400).json({ message: parse.error.flatten().fieldErrors });
  }

  try {
    const updateData: Record<string, unknown> = { ...parse.data };
    if (Object.prototype.hasOwnProperty.call(parse.data, "categoryId")) {
      const categoryId = parse.data.categoryId;
      delete updateData.categoryId;
      updateData.category = categoryId === null ? { disconnect: true } : { connect: { id: categoryId } };
    }
    if (req.file) {
      updateData.image = await saveImageAsset(req, req.file);
    }
    if (Object.prototype.hasOwnProperty.call(parse.data, "gallery")) {
      updateData.gallery = serializeGallery(parse.data.gallery ?? []);
    }
    const product = await prisma.product.update({
      where: { id: Number(id) },
      data: updateData
    });
    res.json(withParsedGallery(product));
  } catch (error) {
    if (isKnownPrismaError(error)) {
      if (error.code === "P2025") return res.status(404).json({ message: "Product not found" });
      if (error.code === "P2002") return res.status(409).json({ message: "A product with this name already exists." });
      if (error.code === "P2003") return res.status(400).json({ message: "Category not found" });
    }
    console.error("Failed to update product", error);
    res.status(500).json({ message: "Failed to update product" });
  }
});

router.delete("/products/:id", requireOwner, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const orderCount = await prisma.orderItem.count({ where: { productId: id } });
    if (orderCount > 0) {
      await prisma.product.update({ where: { id }, data: { isVisible: false } });
      return res.status(200).json({ archived: true });
    }
    await prisma.product.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    console.error("Failed to delete product", error);
    res.status(500).json({ message: "Failed to delete product" });
  }
});

export default router;

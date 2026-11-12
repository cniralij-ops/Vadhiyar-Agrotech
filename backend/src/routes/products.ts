import express from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { withParsedGallery, withParsedGalleryList } from "../utils/product";

const router = express.Router();

router.get("/images/:id", async (req, res) => {
  const asset = await prisma.mediaAsset.findUnique({ where: { id: req.params.id } });
  if (!asset) {
    return res.status(404).json({ message: "Image not found" });
  }
  res.set("Cache-Control", "public, max-age=31536000, immutable");
  res.type(asset.mimeType).send(asset.data);
});

router.get("/", async (req, res) => {
  const { category, search } = req.query as { category?: string; search?: string };
  const filters: Prisma.ProductWhereInput = { isVisible: true };

  if (category) {
    filters.category = { slug: category };
  }
  if (search?.trim()) {
    const normalizedSearch = search.trim();
    filters.OR = [
      { name: { contains: normalizedSearch } },
      { description: { contains: normalizedSearch } }
    ];
  }

  const products = await prisma.product.findMany({
    where: filters,
    include: { category: true },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }]
  });
  res.json(withParsedGalleryList(products));
});

router.get("/categories", async (_req, res) => {
  const categories = await prisma.category.findMany({
    include: { products: { where: { isVisible: true }, select: { id: true } } },
    orderBy: { createdAt: "desc" }
  });
  res.json(categories);
});

router.get("/category/:slug/products", async (req, res) => {
  const { slug } = req.params;
  const category = await prisma.category.findUnique({
    where: { slug },
    include: { products: { where: { isVisible: true }, include: { category: true } } }
  });
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }
  res.json(withParsedGalleryList(category.products));
});

router.get("/:slug", async (req, res) => {
  const { slug } = req.params;
  const product = await prisma.product.findFirst({
    where: { slug, isVisible: true },
    include: { category: true }
  });
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json(withParsedGallery(product));
});

export default router;

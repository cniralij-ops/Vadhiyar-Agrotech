import express from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { withParsedGallery, withParsedGalleryList } from "../utils/product";

const router = express.Router();

router.get("/", async (req, res) => {
  const { category, search } = req.query as { category?: string; search?: string };
  const filters: Prisma.ProductWhereInput = {};

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
    orderBy: { createdAt: "desc" }
  });
  res.json(withParsedGalleryList(products));
});

router.get("/categories", async (_req, res) => {
  const categories = await prisma.category.findMany({
    include: { products: { select: { id: true } } },
    orderBy: { createdAt: "desc" }
  });
  res.json(categories);
});

router.get("/category/:slug/products", async (req, res) => {
  const { slug } = req.params;
  const category = await prisma.category.findUnique({
    where: { slug },
    include: { products: { include: { category: true } } }
  });
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }
  res.json(withParsedGalleryList(category.products));
});

router.get("/:slug", async (req, res) => {
  const { slug } = req.params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true }
  });
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json(withParsedGallery(product));
});

export default router;

/// <reference types="node" />
import { config } from "../src/config";
import { PrismaClient } from "@prisma/client";
import { provisionOwner } from "./owner";

const prisma = new PrismaClient({
  datasources: { db: { url: config.databaseUrl } }
});

const categories = [
  { name: "Fertilizers", slug: "fertilizers", description: "Certified fertilizers for healthy harvests." },
  { name: "Pesticides", slug: "pesticides", description: "Effective crop protection and pest control solutions." },
  { name: "Seeds", slug: "seeds", description: "High-quality seeds for optimal crop yields." },
  { name: "Cattle Feed", slug: "cattle-feed", description: "Nutritious feed for livestock health and productivity." }
];

const products = [
  {
    name: "Organic Spinach Bundle",
    slug: "organic-spinach",
    description: "Leafy, hand-harvested spinach packed with nutrients for daily greens.",
    price: 32,
    stock: 120,
    image: "https://images.unsplash.com/photo-1506806732259-39c2d0268443?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1506806732259-39c2d0268443?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1464965911861-746a04b4bca9?auto=format&fit=crop&w=1000&q=80"
    ],
    category: "vegetables"
  },
  {
    name: "Golden Millet Pack",
    slug: "golden-millet",
    description: "Whole grain millet with a nutty flavor; perfect for traditional meals.",
    price: 58,
    stock: 90,
    image: "https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?auto=format&fit=crop&w=1200&q=80"
    ],
    category: "grains"
  },
  {
    name: "Nitro Green Fertilizer",
    slug: "nitro-green-fertilizer",
    description: "High-performance nitrogen-rich granules for leafy crops.",
    price: 240,
    stock: 45,
    image: "https://images.unsplash.com/photo-1595526114037-97c2d4d06136?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1595526114037-97c2d4d06136?auto=format&fit=crop&w=1200&q=80"
    ],
    category: "fertilizers"
  }
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { description: category.description },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description
      }
    });
  }

  for (const product of products) {
    const category = await prisma.category.findUnique({ where: { slug: product.category } });
    if (!category) continue;
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        description: product.description,
        price: product.price,
        stock: product.stock,
        image: product.image,
        gallery: JSON.stringify(product.gallery)
      },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        stock: product.stock,
        image: product.image,
        gallery: JSON.stringify(product.gallery),
        isAvailable: true,
        isVisible: true,
        category: { connect: { id: category.id } }
      }
    });
  }

  if (process.env.OWNER_PASSWORD) {
    await provisionOwner(prisma);
  } else {
    console.warn("OWNER_PASSWORD is unset; owner account provisioning was skipped.");
  }

  console.log("Seeding completed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

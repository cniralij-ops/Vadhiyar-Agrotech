import { Prisma } from "@prisma/client";

const parseGallery = (value?: string | null) => {
  if (!value) return [] as string[];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

type WithGallery<T> = Omit<T, "gallery"> & { gallery: string[] };

export const withParsedGallery = <T extends { gallery: string | null | undefined }>(
  product: T
): WithGallery<T> => ({
  ...product,
  gallery: parseGallery(product.gallery)
});

export const withParsedGalleryList = <T extends { gallery: string | null | undefined }>(
  products: T[]
): Array<WithGallery<T>> => products.map(withParsedGallery);

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  gallery?: string[];
  category: { id: number; name: string; slug: string };
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export type OrderStatus = "PENDING" | "PROCESSING" | "DELIVERED" | "CANCELLED";

export interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: number;
  product: Product;
}

export interface Order {
  id: number;
  total: number;
  status: OrderStatus;
  fullName: string;
  createdAt: string;
  items: OrderItem[];
}

export interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  gallery?: string[];
  category: { id: number; name: string; slug: string } | null;
}

export interface AdminOrderItem {
  id: number;
  quantity: number;
  unitPrice: number;
  product: AdminProduct;
}

export type OrderStatus = "PENDING" | "PROCESSING" | "DELIVERED" | "CANCELLED";

export interface AdminOrder {
  id: number;
  total: number;
  status: OrderStatus;
  fullName: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes?: string;
  createdAt: string;
  items: AdminOrderItem[];
  user: { id: number; name: string; email: string };
}

export interface AdminCustomer {
  id: number;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  loginHistory?: { action: string; createdAt: string }[];
}

export interface DashboardSummary {
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  recentActivity: Array<{
    id: number;
    action: string;
    createdAt: string;
    user: { name: string; email: string };
  }>;
}

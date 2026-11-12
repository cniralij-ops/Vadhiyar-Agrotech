import cors from "cors";
import express from "express";
import fs from "fs";
import path from "path";
import adminRoutes from "./routes/admin";
import authRoutes from "./routes/auth";
import customersRoutes from "./routes/customers";
import ordersRoutes from "./routes/orders";
import productsRoutes from "./routes/products";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

const uploadsDir = path.resolve(__dirname, "..", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
app.set("trust proxy", 1);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use("/uploads", express.static(uploadsDir));

app.get("/", (_req, res) => {
  res.json({ message: "Vadhiyar Agrotech API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/customers", customersRoutes);

app.use(errorHandler);

export default app;

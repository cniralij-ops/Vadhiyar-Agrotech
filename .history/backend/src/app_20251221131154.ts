import cors from "cors";
import express from "express";
import adminRoutes from "./routes/admin";
import authRoutes from "./routes/auth";
import customersRoutes from "./routes/customers";
import ordersRoutes from "./routes/orders";
import productsRoutes from "./routes/products";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

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

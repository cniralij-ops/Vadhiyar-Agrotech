import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { prisma } from "../utils/prisma";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: "ADMIN" | "CUSTOMER";
    email: string;
    name: string;
  };
}

const isValidRole = (role: string): role is "ADMIN" | "CUSTOMER" => role === "ADMIN" || role === "CUSTOMER";

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing authorization" });
  }

  const token = authHeader.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    if (!payload || !payload.sub || !payload.role) {
      throw new Error("Invalid payload");
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(payload.sub) }
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!isValidRole(user.role)) {
      return res.status(500).json({ message: "Invalid user role" });
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const requireRole = (role: "ADMIN" | "CUSTOMER") => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
};

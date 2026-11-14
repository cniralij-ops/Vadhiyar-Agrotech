import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(3),
  phone: z.string().min(6),
  email: z.string().email().optional(),
  addressLine: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  otpToken: z.string().uuid()
});

export const loginSchema = z
  .object({
    name: z.string().min(3).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(6).optional(),
    password: z.string().min(8).optional()
  })
  .superRefine((data, ctx) => {
    const hasEmail = Boolean(data.email);
    const hasPhone = Boolean(data.phone);

    if (!hasEmail && !hasPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide either an email or phone number",
        path: ["email"]
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide either an email or phone number",
        path: ["phone"]
      });
      return;
    }

    if (hasEmail && hasPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose a single login method",
        path: ["email"]
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose a single login method",
        path: ["phone"]
      });
    }

    if (hasPhone && !data.name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Name is required for phone login",
        path: ["name"]
      });
    }
  });

export const ownerLoginSchema = z.object({
  password: z.string().min(14).max(256)
});

export const otpSendSchema = z.object({
  phone: z.string().min(6)
});

export const otpVerifySchema = z.object({
  token: z.string().uuid(),
  phone: z.string().min(6),
  code: z.string().regex(/^\d{6}$/)
});

export const otpCompleteSchema = z.object({
  token: z.string().uuid(),
  phone: z.string().min(6),
  code: z.string().regex(/^\d{6}$/),
  name: z.string().min(2).optional(),
  addressLine: z.string().min(5).optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional()
});

const productNameSchema = z.preprocess(
  (value) => typeof value === "string" && !value.trim() ? "Untitled product" : value,
  z.string().trim().min(1)
);

export const productSchema = z.object({
  name: productNameSchema.default("Untitled product"),
  description: z.string().default(""),
  price: z.number().finite().nonnegative().default(0),
  stock: z.number().int().nonnegative().default(0),
  image: z.string().url().or(z.literal("")).default(""),
  categoryId: z.number().int().positive().nullable().default(null),
  gallery: z.array(z.string().url()).optional(),
  isAvailable: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isVisible: z.boolean().default(false)
});

export const productUpdateSchema = z.object({
  name: productNameSchema.optional(),
  description: z.string().optional(),
  price: z.number().finite().nonnegative().optional(),
  stock: z.number().int().nonnegative().optional(),
  image: z.string().url().or(z.literal("")).optional(),
  categoryId: z.number().int().positive().nullable().optional(),
  gallery: z.array(z.string().url()).optional(),
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isVisible: z.boolean().optional()
});

export const orderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1)
      })
    )
    .min(1),
  fullName: z.string().min(3),
  mobile: z.string().min(6),
  email: z.string().email(),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(4),
  notes: z.string().max(500).optional()
});

export const orderStatusSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "DELIVERED", "CANCELLED"])
});

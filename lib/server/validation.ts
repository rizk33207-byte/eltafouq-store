import { z } from "zod";
import { normalizeEgyptPhone, isCanonicalEgyptPhone } from "./phone";

export const gradeSchema = z.enum(["g1", "g2", "g3"]);
export const langSchema = z.enum(["ar", "en"]);
export const subjectSchema = z.enum(["bio", "phy", "chem"]);
export const orderStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);
export const adminRoleSchema = z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
export const revenueRangeSchema = z.enum(["7d", "30d", "12m"]);

const requiredTextSchema = z.string().trim().min(1);

const phoneSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value) => normalizeEgyptPhone(value))
  .refine((value) => isCanonicalEgyptPhone(value), {
    message: "INVALID_EGYPT_PHONE",
  });

const quantitySchema = z.coerce.number().int().min(1);

const featuredQuerySchema = z
  .union([z.boolean(), z.string()])
  .transform((value) => {
    if (typeof value === "boolean") {
      return value;
    }

    if (value === "true" || value === "1") {
      return true;
    }

    if (value === "false" || value === "0") {
      return false;
    }

    return undefined;
  })
  .optional();

export const booksQuerySchema = z
  .object({
    grade: gradeSchema.optional(),
    lang: langSchema.optional(),
    language: langSchema.optional(),
    subject: subjectSchema.optional(),
    q: z.string().trim().optional(),
    featured: featuredQuerySchema,
  })
  .transform((raw) => {
    const grade = raw.grade;
    const lang = grade ? raw.lang ?? raw.language : undefined;
    const subject = grade && lang ? raw.subject : undefined;

    return {
      ...(grade ? { grade } : {}),
      ...(lang ? { lang } : {}),
      ...(subject ? { subject } : {}),
      ...(raw.q ? { q: raw.q } : {}),
      ...(raw.featured !== undefined ? { featured: raw.featured } : {}),
    };
  });

export const createOrderBodySchema = z.object({
  customer: z.object({
    name: requiredTextSchema,
    phone: phoneSchema,
    city: requiredTextSchema,
    address: requiredTextSchema,
    notes: z.string().trim().optional(),
  }),
  items: z
    .array(
      z.object({
        bookId: z.string().trim().min(1),
        qty: quantitySchema,
      }),
    )
    .min(1),
});

export const patchOrderStatusBodySchema = z.object({
  status: orderStatusSchema,
});

export const adminLoginBodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const imageSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    if (!value) {
      return null;
    }

    return value;
  });

const bookAdminFieldsSchema = z.object({
  title: requiredTextSchema,
  grade: gradeSchema,
  language: langSchema,
  subject: subjectSchema,
  price: z.coerce.number().nonnegative(),
  description: requiredTextSchema,
  image: imageSchema,
  featured: z.coerce.boolean().default(false),
  stock: z.coerce.number().int().min(0),
});

export const createAdminBookBodySchema = bookAdminFieldsSchema.extend({
  id: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
});

export const patchAdminBookBodySchema = bookAdminFieldsSchema;
export const patchAdminBookStockBodySchema = z.object({
  stock: z.coerce.number().int().min(0),
});

export const orderIdParamSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^ORD-\d{8}-[A-Z0-9]{4}$/);

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/server/admin-guard";
import {
  isPrismaDbUnavailableError,
  logDbUnavailableInDev,
} from "@/lib/server/prisma-errors";
import { createAdminBookBodySchema } from "@/lib/server/validation";

const querySchema = z.object({
  q: z.string().trim().optional(),
  grade: z.enum(["g1", "g2", "g3"]).optional(),
  language: z.enum(["ar", "en"]).optional(),
  subject: z.enum(["bio", "phy", "chem"]).optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bookSelect = {
  id: true,
  title: true,
  grade: true,
  language: true,
  subject: true,
  price: true,
  description: true,
  image: true,
  stock: true,
  featured: true,
} as const;

const withLowStockFlag = <T extends { stock: number }>(book: T) => ({
  ...book,
  lowStock: book.stock <= 5,
});

const invalidatePublicBookPaths = (bookId?: string) => {
  revalidatePath("/ar");
  revalidatePath("/en");
  revalidatePath("/ar/books");
  revalidatePath("/en/books");

  if (bookId) {
    revalidatePath(`/ar/product/${bookId}`);
    revalidatePath(`/en/product/${bookId}`);
  }
};

const toSafeBookIdSegment = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);

const buildBookId = (title: string): string => {
  const segment = toSafeBookIdSegment(title);
  const suffix = crypto.randomUUID().slice(0, 6).toLowerCase();

  return `${segment || "book"}-${suffix}`;
};

export async function GET(request: Request) {
  const { response } = await requireRole(request, [
    "SUPER_ADMIN",
    "ADMIN",
    "EDITOR",
  ]);

  if (response) {
    return response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.parse({
      q: searchParams.get("q") ?? undefined,
      grade: searchParams.get("grade") ?? undefined,
      language: searchParams.get("language") ?? undefined,
      subject: searchParams.get("subject") ?? undefined,
    });

    const where: Prisma.BookWhereInput = {
      ...(parsed.grade ? { grade: parsed.grade } : {}),
      ...(parsed.language ? { language: parsed.language } : {}),
      ...(parsed.subject ? { subject: parsed.subject } : {}),
      ...(parsed.q
        ? {
            OR: [
              { title: { contains: parsed.q, mode: "insensitive" } },
              { description: { contains: parsed.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const books = await prisma.book.findMany({
      where,
      select: bookSelect,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      data: books.map((book) => withLowStockFlag(book)),
      meta: {
        total: books.length,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "INVALID_QUERY",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    if (isPrismaDbUnavailableError(error)) {
      logDbUnavailableInDev("GET /api/admin/books", error);
      return NextResponse.json(
        {
          error: "DB_UNAVAILABLE",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: "FAILED_TO_FETCH_ADMIN_BOOKS",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const { response } = await requireRole(request, ["SUPER_ADMIN", "ADMIN"]);

  if (response) {
    return response;
  }

  try {
    const body = await request.json();
    const payload = createAdminBookBodySchema.parse(body);
    const bookId = payload.id?.trim() || buildBookId(payload.title);

    const created = await prisma.book.create({
      data: {
        id: bookId,
        title: payload.title,
        grade: payload.grade,
        language: payload.language,
        subject: payload.subject,
        price: payload.price,
        description: payload.description,
        image: payload.image,
        featured: payload.featured,
        stock: payload.stock,
      },
      select: bookSelect,
    });

    invalidatePublicBookPaths(bookId);

    return NextResponse.json(
      {
        data: withLowStockFlag(created),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "INVALID_CREATE_PAYLOAD",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        {
          error: "BOOK_ID_EXISTS",
        },
        { status: 409 },
      );
    }

    if (isPrismaDbUnavailableError(error)) {
      logDbUnavailableInDev("POST /api/admin/books", error);
      return NextResponse.json(
        {
          error: "DB_UNAVAILABLE",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: "FAILED_TO_CREATE_ADMIN_BOOK",
      },
      { status: 500 },
    );
  }
}

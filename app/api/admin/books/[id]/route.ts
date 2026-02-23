import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/server/admin-guard";
import {
  isPrismaDbUnavailableError,
  logDbUnavailableInDev,
} from "@/lib/server/prisma-errors";
import {
  patchAdminBookBodySchema,
  patchAdminBookStockBodySchema,
} from "@/lib/server/validation";

interface AdminBookRouteContext {
  params: Promise<{ id: string }>;
}

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

const invalidatePublicBookPaths = (bookId: string) => {
  revalidatePath("/ar");
  revalidatePath("/en");
  revalidatePath("/ar/books");
  revalidatePath("/en/books");
  revalidatePath(`/ar/product/${bookId}`);
  revalidatePath(`/en/product/${bookId}`);
};

const resolveBookId = async (
  params: Promise<{ id: string }>,
): Promise<string | null> => {
  const { id } = await params;
  const bookId = id.trim();

  if (!bookId) {
    return null;
  }

  return bookId;
};

export async function PATCH(
  request: Request,
  { params }: AdminBookRouteContext,
) {
  const context = await requireRole(request, ["SUPER_ADMIN", "ADMIN", "EDITOR"]);

  if (context.response || !context.admin) {
    return (
      context.response ??
      NextResponse.json(
        {
          error: "UNAUTHORIZED",
        },
        { status: 401 },
      )
    );
  }

  try {
    const bookId = await resolveBookId(params);

    if (!bookId) {
      return NextResponse.json(
        {
          error: "INVALID_BOOK_ID",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    let updated;

    if (context.admin.role === "EDITOR") {
      updated = await prisma.book.update({
        where: { id: bookId },
        data: {
          stock: patchAdminBookStockBodySchema.parse(body).stock,
        },
        select: bookSelect,
      });
    } else {
      const payload = patchAdminBookBodySchema.parse(body);
      updated = await prisma.book.update({
        where: { id: bookId },
        data: {
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
    }

    invalidatePublicBookPaths(bookId);

    return NextResponse.json({
      data: withLowStockFlag(updated),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "INVALID_PATCH_PAYLOAD",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json(
        {
          error: "BOOK_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    if (isPrismaDbUnavailableError(error)) {
      logDbUnavailableInDev("PATCH /api/admin/books/[id]", error);
      return NextResponse.json(
        {
          error: "DB_UNAVAILABLE",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: "FAILED_TO_UPDATE_ADMIN_BOOK",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: AdminBookRouteContext,
) {
  const context = await requireRole(request, ["SUPER_ADMIN"]);

  if (context.response) {
    return context.response;
  }

  try {
    const bookId = await resolveBookId(params);

    if (!bookId) {
      return NextResponse.json(
        {
          error: "INVALID_BOOK_ID",
        },
        { status: 400 },
      );
    }

    await prisma.book.delete({
      where: { id: bookId },
    });

    invalidatePublicBookPaths(bookId);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json(
        {
          error: "BOOK_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json(
        {
          error: "BOOK_IN_USE",
        },
        { status: 409 },
      );
    }

    if (isPrismaDbUnavailableError(error)) {
      logDbUnavailableInDev("DELETE /api/admin/books/[id]", error);
      return NextResponse.json(
        {
          error: "DB_UNAVAILABLE",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: "FAILED_TO_DELETE_ADMIN_BOOK",
      },
      { status: 500 },
    );
  }
}

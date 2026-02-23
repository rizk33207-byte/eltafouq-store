import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/server/admin-guard";
import {
  isPrismaDbUnavailableError,
  logDbUnavailableInDev,
} from "@/lib/server/prisma-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const books = await prisma.book.findMany({
      where: {
        stock: {
          lte: 5,
        },
      },
      select: {
        id: true,
        title: true,
        grade: true,
        language: true,
        subject: true,
        stock: true,
        image: true,
      },
      orderBy: [{ stock: "asc" }, { title: "asc" }],
    });

    return NextResponse.json({
      data: books.map((book) => ({
        ...book,
        lowStock: true,
      })),
      meta: {
        total: books.length,
      },
    });
  } catch (error) {
    if (isPrismaDbUnavailableError(error)) {
      logDbUnavailableInDev("GET /api/admin/inventory/alerts", error);
      return NextResponse.json(
        {
          error: "DB_UNAVAILABLE",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: "FAILED_TO_FETCH_INVENTORY_ALERTS",
      },
      { status: 500 },
    );
  }
}

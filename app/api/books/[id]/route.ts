import { NextResponse } from "next/server";
import { getBook } from "@/lib/server/books-service";
import {
  logDbErrorInDev,
  toHttpError,
} from "@/lib/server/prisma-errors";

interface BookRouteContext {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: BookRouteContext) {
  try {
    const { id } = await params;
    const book = await getBook(id);

    if (!book) {
      return NextResponse.json(
        {
          error: "BOOK_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: book });
  } catch (error) {
    const dbHttpError = toHttpError(error);
    if (dbHttpError) {
      logDbErrorInDev("GET /api/books/[id]", error);
      return NextResponse.json(
        dbHttpError.body,
        { status: dbHttpError.status },
      );
    }

    return NextResponse.json(
      {
        error: "FAILED_TO_FETCH_BOOK",
      },
      { status: 500 },
    );
  }
}

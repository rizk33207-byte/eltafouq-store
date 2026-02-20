import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { listBooks } from "@/lib/server/books-service";
import {
  logDbErrorInDev,
  toHttpError,
} from "@/lib/server/prisma-errors";
import { booksQuerySchema } from "@/lib/server/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsedFilters = booksQuerySchema.parse({
      grade: searchParams.get("grade") ?? undefined,
      lang: searchParams.get("lang") ?? undefined,
      language: searchParams.get("language") ?? undefined,
      subject: searchParams.get("subject") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      featured: searchParams.get("featured") ?? undefined,
    });

    const result = await listBooks(parsedFilters);

    return NextResponse.json({
      data: result.data,
      meta: {
        total: result.total,
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

    const dbHttpError = toHttpError(error);
    if (dbHttpError) {
      logDbErrorInDev("GET /api/books", error);
      return NextResponse.json(
        dbHttpError.body,
        { status: dbHttpError.status },
      );
    }

    return NextResponse.json(
      {
        error: "FAILED_TO_FETCH_BOOKS",
      },
      { status: 500 },
    );
  }
}

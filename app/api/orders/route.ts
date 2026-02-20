import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createOrder, OrderServiceError } from "@/lib/server/orders-service";
import {
  logDbErrorInDev,
  toHttpError,
} from "@/lib/server/prisma-errors";
import { rateLimitOrderCreate } from "@/lib/server/rate-limit";
import { createOrderBodySchema } from "@/lib/server/validation";

const getClientIdentifier = (request: Request): string => {
  const ipFromForwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const ipFromRealIp = request.headers.get("x-real-ip")?.trim();

  return ipFromForwarded || ipFromRealIp || "local-dev";
};

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rateLimitKey = `create-order:${getClientIdentifier(request)}`;
    const rateLimitResult = await rateLimitOrderCreate(rateLimitKey);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "RATE_LIMITED",
        },
        { status: 429 },
      );
    }

    const body = await request.json();
    const payload = createOrderBodySchema.parse(body);
    const result = await createOrder(payload);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "INVALID_ORDER_PAYLOAD",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    if (error instanceof OrderServiceError) {
      return NextResponse.json(
        {
          code: error.code,
          bookId: error.bookId,
          message: error.message,
        },
        { status: error.status },
      );
    }

    const dbHttpError = toHttpError(error);
    if (dbHttpError) {
      logDbErrorInDev("POST /api/orders", error);
      return NextResponse.json(
        dbHttpError.body,
        { status: dbHttpError.status },
      );
    }

    return NextResponse.json(
      {
        error: "FAILED_TO_CREATE_ORDER",
      },
      { status: 500 },
    );
  }
}

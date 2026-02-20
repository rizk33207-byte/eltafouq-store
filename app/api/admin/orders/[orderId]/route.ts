import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireRole } from "@/lib/server/admin-guard";
import {
  isPrismaDbUnavailableError,
  logDbUnavailableInDev,
} from "@/lib/server/prisma-errors";
import { OrderServiceError, updateOrderStatus } from "@/lib/server/orders-service";
import {
  orderIdParamSchema,
  patchOrderStatusBodySchema,
} from "@/lib/server/validation";

interface AdminOrderRouteContext {
  params: Promise<{ orderId: string }>;
}

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: AdminOrderRouteContext,
) {
  const { response } = await requireRole(request, ["SUPER_ADMIN", "ADMIN"]);

  if (response) {
    return response;
  }

  try {
    const { orderId } = await params;
    const normalizedOrderId = orderIdParamSchema.parse(orderId);
    const body = await request.json();
    const payload = patchOrderStatusBodySchema.parse(body);
    const updated = await updateOrderStatus(normalizedOrderId, payload.status);

    return NextResponse.json({
      data: updated.data,
      meta: {
        timeline: updated.timeline,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "INVALID_PAYLOAD",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json(
        {
          error: "ORDER_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    if (error instanceof OrderServiceError) {
      return NextResponse.json(
        {
          error: error.code,
          code: error.code,
          bookId: error.bookId,
          message: error.message,
        },
        { status: error.status },
      );
    }

    if (isPrismaDbUnavailableError(error)) {
      logDbUnavailableInDev("PATCH /api/admin/orders/[orderId]", error);
      return NextResponse.json(
        {
          error: "DB_UNAVAILABLE",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: "FAILED_TO_UPDATE_ADMIN_ORDER",
      },
      { status: 500 },
    );
  }
}

import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireRole } from "@/lib/server/admin-guard";
import {
  logDbErrorInDev,
  toHttpError,
} from "@/lib/server/prisma-errors";
import {
  getOrderForTracking,
  OrderServiceError,
  updateOrderStatus,
} from "@/lib/server/orders-service";
import {
  orderIdParamSchema,
  patchOrderStatusBodySchema,
} from "@/lib/server/validation";

interface OrderRouteContext {
  params: Promise<{ orderId: string }>;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: OrderRouteContext) {
  try {
    const { orderId } = await params;
    const normalizedOrderId = orderIdParamSchema.parse(orderId);
    const order = await getOrderForTracking(normalizedOrderId);

    if (!order) {
      return NextResponse.json(
        {
          error: "ORDER_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: order.data,
      meta: {
        timeline: order.timeline,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "INVALID_ORDER_ID",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    const dbHttpError = toHttpError(error);
    if (dbHttpError) {
      logDbErrorInDev("GET /api/orders/[orderId]", error);
      return NextResponse.json(
        dbHttpError.body,
        { status: dbHttpError.status },
      );
    }

    return NextResponse.json(
      {
        error: "FAILED_TO_FETCH_ORDER",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: OrderRouteContext) {
  try {
    const { response } = await requireRole(request, ["SUPER_ADMIN", "ADMIN"]);

    if (response) {
      return response;
    }

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
          error: "INVALID_PATCH_PAYLOAD",
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

    const dbHttpError = toHttpError(error);
    if (dbHttpError) {
      logDbErrorInDev("PATCH /api/orders/[orderId]", error);
      return NextResponse.json(
        dbHttpError.body,
        { status: dbHttpError.status },
      );
    }

    return NextResponse.json(
      {
        error: "FAILED_TO_UPDATE_ORDER",
      },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/server/admin-guard";
import {
  isPrismaDbUnavailableError,
  logDbUnavailableInDev,
} from "@/lib/server/prisma-errors";
import type { OrderStatus } from "@/lib/types";

const PAGE_SIZE = 20;
export const dynamic = "force-dynamic";
const statusValues: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const querySchema = z.object({
  status: z.enum(statusValues).optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
});

const mapStatusCounts = (
  grouped: Array<{ status: string; _count: { status: number } }>,
): Record<OrderStatus, number> => {
  const initial = statusValues.reduce(
    (accumulator, status) => ({ ...accumulator, [status]: 0 }),
    {} as Record<OrderStatus, number>,
  );

  for (const item of grouped) {
    if (statusValues.includes(item.status as OrderStatus)) {
      initial[item.status as OrderStatus] = item._count.status;
    }
  }

  return initial;
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
      status: searchParams.get("status") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      page: searchParams.get("page") ?? 1,
    });

    const skip = (parsed.page - 1) * PAGE_SIZE;
    const where = {
      ...(parsed.status ? { status: parsed.status } : {}),
      ...(parsed.q
        ? {
            OR: [
              { orderId: { contains: parsed.q, mode: "insensitive" as const } },
              { customerName: { contains: parsed.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [orders, total, groupedByStatus] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          orderId: true,
          status: true,
          createdAt: true,
          total: true,
          customerName: true,
          city: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.order.count({ where }),
      prisma.order.groupBy({
        by: ["status"],
        _count: {
          status: true,
        },
      }),
    ]);

    return NextResponse.json({
      data: orders.map((order) => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
      })),
      meta: {
        page: parsed.page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        stats: mapStatusCounts(groupedByStatus),
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
      logDbUnavailableInDev("GET /api/admin/orders", error);
      return NextResponse.json(
        {
          error: "DB_UNAVAILABLE",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: "FAILED_TO_FETCH_ADMIN_ORDERS",
      },
      { status: 500 },
    );
  }
}

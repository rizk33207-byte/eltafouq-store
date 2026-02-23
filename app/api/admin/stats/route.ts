import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/server/admin-guard";
import {
  isPrismaDbUnavailableError,
  logDbUnavailableInDev,
} from "@/lib/server/prisma-errors";
import type { OrderStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const statusOrder: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const toStatusCounts = (
  grouped: Array<{ status: string; _count: { status: number } }>,
): Record<OrderStatus, number> => {
  const counts = Object.fromEntries(statusOrder.map((status) => [status, 0])) as Record<
    OrderStatus,
    number
  >;

  grouped.forEach((entry) => {
    if (statusOrder.includes(entry.status as OrderStatus)) {
      counts[entry.status as OrderStatus] = entry._count.status;
    }
  });

  return counts;
};

const getDayStart = (): Date => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
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
    const todayStart = getDayStart();

    const [totalOrders, groupedByStatus, deliveredRevenue, todayDeliveredRevenue] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.groupBy({
          by: ["status"],
          _count: {
            status: true,
          },
        }),
        prisma.order.aggregate({
          where: {
            status: "DELIVERED",
          },
          _sum: {
            total: true,
          },
        }),
        prisma.order.aggregate({
          where: {
            status: "DELIVERED",
            createdAt: {
              gte: todayStart,
            },
          },
          _sum: {
            total: true,
          },
        }),
      ]);

    const counts = toStatusCounts(groupedByStatus);

    return NextResponse.json({
      totalOrders,
      totalRevenue: deliveredRevenue._sum.total ?? 0,
      todayRevenue: todayDeliveredRevenue._sum.total ?? 0,
      pendingOrders: counts.PENDING,
      confirmedOrders: counts.CONFIRMED,
      shippedOrders: counts.SHIPPED,
      deliveredOrders: counts.DELIVERED,
      cancelledOrders: counts.CANCELLED,
    });
  } catch (error) {
    if (isPrismaDbUnavailableError(error)) {
      logDbUnavailableInDev("GET /api/admin/stats", error);
      return NextResponse.json(
        {
          error: "DB_UNAVAILABLE",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: "FAILED_TO_FETCH_ADMIN_STATS",
      },
      { status: 500 },
    );
  }
}

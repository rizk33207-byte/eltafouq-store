import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/server/admin-guard";
import {
  isPrismaDbUnavailableError,
  logDbUnavailableInDev,
} from "@/lib/server/prisma-errors";
import { revenueRangeSchema } from "@/lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  range: revenueRangeSchema.default("30d"),
});

const toDayKey = (value: Date): string => value.toISOString().slice(0, 10);
const toMonthKey = (value: Date): string => value.toISOString().slice(0, 7);

const startOfDay = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const startOfMonth = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const addMonths = (date: Date, months: number): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));

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
    const { range } = querySchema.parse({
      range: searchParams.get("range") ?? "30d",
    });

    if (range === "12m") {
      const monthStart = startOfMonth(addMonths(new Date(), -11));

      const rows = await prisma.$queryRaw<Array<{ bucket: Date; revenue: number }>>`
        SELECT
          date_trunc('month', "createdAt") AS bucket,
          COALESCE(SUM("total"), 0)::double precision AS revenue
        FROM "Order"
        WHERE "status" = 'DELIVERED'
          AND "createdAt" >= ${monthStart}
        GROUP BY bucket
        ORDER BY bucket ASC
      `;

      const revenuesByMonth = new Map(rows.map((row) => [toMonthKey(row.bucket), row.revenue]));
      const labels: string[] = [];
      const data: number[] = [];

      for (let index = 0; index < 12; index += 1) {
        const cursor = addMonths(monthStart, index);
        const label = toMonthKey(cursor);
        labels.push(label);
        data.push(revenuesByMonth.get(label) ?? 0);
      }

      return NextResponse.json({ labels, data });
    }

    const days = range === "7d" ? 7 : 30;
    const dayStart = startOfDay(addDays(new Date(), -(days - 1)));
    const rows = await prisma.$queryRaw<Array<{ bucket: Date; revenue: number }>>`
      SELECT
        date_trunc('day', "createdAt") AS bucket,
        COALESCE(SUM("total"), 0)::double precision AS revenue
      FROM "Order"
      WHERE "status" = 'DELIVERED'
        AND "createdAt" >= ${dayStart}
      GROUP BY bucket
      ORDER BY bucket ASC
    `;

    const revenuesByDay = new Map(rows.map((row) => [toDayKey(row.bucket), row.revenue]));
    const labels: string[] = [];
    const data: number[] = [];

    for (let index = 0; index < days; index += 1) {
      const cursor = addDays(dayStart, index);
      const label = toDayKey(cursor);
      labels.push(label);
      data.push(revenuesByDay.get(label) ?? 0);
    }

    return NextResponse.json({ labels, data });
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
      logDbUnavailableInDev("GET /api/admin/stats/revenue", error);
      return NextResponse.json(
        {
          error: "DB_UNAVAILABLE",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: "FAILED_TO_FETCH_REVENUE_STATS",
      },
      { status: 500 },
    );
  }
}

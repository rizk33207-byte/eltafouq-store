import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin-guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { admin, response } = await requireAdmin(request);

  if (!admin || response) {
    return (
      response ??
      NextResponse.json(
        {
          error: "UNAUTHORIZED",
        },
        { status: 401 },
      )
    );
  }

  return NextResponse.json({
    data: {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    },
  });
}

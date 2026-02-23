import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/server/admin-password";
import {
  createAdminSessionToken,
  setAdminSessionCookie,
} from "@/lib/server/admin-session";
import { adminLoginBodySchema } from "@/lib/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = adminLoginBodySchema.parse(body);

    const admin = await prisma.admin.findUnique({
      where: {
        email: payload.email,
      },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        {
          error: "INVALID_CREDENTIALS",
        },
        { status: 401 },
      );
    }

    const isValidPassword = await verifyAdminPassword(payload.password, admin.password);

    if (!isValidPassword) {
      return NextResponse.json(
        {
          error: "INVALID_CREDENTIALS",
        },
        { status: 401 },
      );
    }

    const token = await createAdminSessionToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
    });

    const response = NextResponse.json({
      data: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
    });

    setAdminSessionCookie(response, token);
    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "INVALID_LOGIN_PAYLOAD",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "FAILED_TO_LOGIN",
      },
      { status: 500 },
    );
  }
}

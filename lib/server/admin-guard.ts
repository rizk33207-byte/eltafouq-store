import { NextResponse } from "next/server";
import type { AdminRole } from "@/lib/types";
import { readAdminSession, type AdminSessionPayload } from "./admin-session";

export type AdminRequestContext =
  | { admin: AdminSessionPayload; response: null }
  | { admin: null; response: NextResponse };

const unauthorizedResponse = () =>
  NextResponse.json(
    {
      error: "UNAUTHORIZED",
    },
    { status: 401 },
  );

const forbiddenResponse = () =>
  NextResponse.json(
    {
      error: "FORBIDDEN",
    },
    { status: 403 },
  );

export const requireAdmin = async (request: Request): Promise<AdminRequestContext> => {
  const admin = await readAdminSession(request);

  if (!admin) {
    return {
      admin: null,
      response: unauthorizedResponse(),
    };
  }

  return {
    admin,
    response: null,
  };
};

export const requireRole = async (
  request: Request,
  allowedRoles: AdminRole[],
): Promise<AdminRequestContext> => {
  const context = await requireAdmin(request);

  if (context.response || !context.admin) {
    return context;
  }

  if (!allowedRoles.includes(context.admin.role)) {
    return {
      admin: null,
      response: forbiddenResponse(),
    };
  }

  return context;
};

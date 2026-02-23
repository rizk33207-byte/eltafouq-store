import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/admin-guard";
import { assertCloudinaryEnv, getCloudinaryEnvDiagnostics } from "@/lib/server/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { response } = await requireRole(request, ["SUPER_ADMIN", "ADMIN"]);

  if (response) {
    return response;
  }

  const diagnostics = getCloudinaryEnvDiagnostics();

  if (process.env.NODE_ENV === "development") {
    console.log({
      cwd: diagnostics.cwd,
      cloudinary: diagnostics.cloudinary,
    });
  }

  try {
    assertCloudinaryEnv();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[cloudinary] diagnostics missing env vars", {
        missing: diagnostics.missing,
        message: error instanceof Error ? error.message : "Unknown env error",
      });
    }
  }

  return NextResponse.json(
    {
      cloudName: diagnostics.cloudinary.cloudName,
      apiKey: diagnostics.cloudinary.apiKey,
      apiSecret: diagnostics.cloudinary.apiSecret,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

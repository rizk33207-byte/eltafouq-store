import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/admin-guard";
import { assertCloudinaryEnv, getCloudinaryEnvDiagnostics } from "@/lib/server/env";

export const dynamic = "force-dynamic";

const MAX_IMAGE_SIZE_BYTES = 7 * 1024 * 1024;

const toErrorCode = (value: unknown): string | undefined => {
  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return undefined;
};

const asObject = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;

const parseUploadErrorDetails = (error: unknown): { code?: string; message: string } => {
  if (typeof error === "string" && error.trim()) {
    return {
      message: error.trim(),
    };
  }

  if (error instanceof Error) {
    const cloudinaryError = error as Error & {
      http_code?: number;
      code?: string;
      name?: string;
    };

    return {
      message: cloudinaryError.message || "Upload failed.",
      code:
        toErrorCode(cloudinaryError.http_code) ??
        toErrorCode(cloudinaryError.code) ??
        toErrorCode(cloudinaryError.name),
    };
  }

  const root = asObject(error);
  const nestedError = asObject(root?.error);
  const message =
    (typeof root?.message === "string" && root.message.trim()) ||
    (typeof nestedError?.message === "string" && nestedError.message.trim()) ||
    (typeof root?.error_description === "string" && root.error_description.trim()) ||
    "Upload failed.";
  const code =
    toErrorCode(root?.http_code) ??
    toErrorCode(root?.code) ??
    toErrorCode(root?.name) ??
    toErrorCode(nestedError?.http_code) ??
    toErrorCode(nestedError?.code) ??
    toErrorCode(nestedError?.name);

  return { message, code };
};

const uploadWithStream = async (
  buffer: Buffer,
  options: { folder?: string },
): Promise<{ secure_url: string }> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: options.folder,
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? { message: "Cloudinary did not return secure_url." });
          return;
        }

        resolve({
          secure_url: result.secure_url,
        });
      },
    );

    stream.end(buffer);
  });

export async function POST(request: Request) {
  const { response } = await requireRole(request, ["SUPER_ADMIN", "ADMIN"]);

  if (response) {
    return response;
  }

  try {
    const diagnostics = getCloudinaryEnvDiagnostics();
    let cloudinaryConfig: ReturnType<typeof assertCloudinaryEnv>;

    if (process.env.NODE_ENV === "development") {
      console.log({
        cwd: diagnostics.cwd,
        cloudinary: diagnostics.cloudinary,
      });
    }

    try {
      cloudinaryConfig = assertCloudinaryEnv();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[cloudinary] missing env vars", {
          cwd: diagnostics.cwd,
          missing: diagnostics.missing,
          message: error instanceof Error ? error.message : "Unknown env error",
        });
      }

      return NextResponse.json(
        {
          error: "UPLOAD_FAILED",
          details: {
            message: "Cloudinary is not configured.",
            code: "CLOUDINARY_NOT_CONFIGURED",
          },
        },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        {
          error: "UPLOAD_FAILED",
          details: {
            message: "File is required.",
            code: "FILE_REQUIRED",
          },
        },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "UPLOAD_FAILED",
          details: {
            message: "Invalid file payload.",
            code: "INVALID_FILE",
          },
        },
        { status: 400 },
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        {
          error: "UPLOAD_FAILED",
          details: {
            message: "Only image files are allowed.",
            code: "INVALID_FILE_TYPE",
          },
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: "UPLOAD_FAILED",
          details: {
            message: "Image file is too large.",
            code: "FILE_TOO_LARGE",
          },
        },
        { status: 413 },
      );
    }

    cloudinary.config({
      cloud_name: cloudinaryConfig.cloudName,
      api_key: cloudinaryConfig.apiKey,
      api_secret: cloudinaryConfig.apiSecret,
    });

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadWithStream(fileBuffer, {
      folder: cloudinaryConfig.folder,
    });

    return NextResponse.json({
      url: result.secure_url,
    });
  } catch (error) {
    const details = parseUploadErrorDetails(error);
    let snapshot: string | undefined;

    if (error && typeof error === "object") {
      try {
        snapshot = JSON.stringify(error).slice(0, 500);
      } catch {
        snapshot = "[unserializable-object]";
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.error("[cloudinary]", {
        code: details.code,
        message: details.message,
        snapshot,
      });
    }

    return NextResponse.json(
      {
        error: "UPLOAD_FAILED",
        details,
      },
      { status: 502 },
    );
  }
}

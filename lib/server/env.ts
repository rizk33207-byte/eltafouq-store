import { existsSync } from "node:fs";
import { join } from "node:path";

const CLOUDINARY_REQUIRED_KEYS = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

const normalizeEnvValue = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const hasWrappedQuotes =
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));

  if (!hasWrappedQuotes) {
    return trimmed;
  }

  const unwrapped = trimmed.slice(1, -1).trim();
  return unwrapped || undefined;
};

const readCloudinaryEnv = () => {
  const cloudName = normalizeEnvValue(process.env.CLOUDINARY_CLOUD_NAME);
  const apiKey = normalizeEnvValue(process.env.CLOUDINARY_API_KEY);
  const apiSecret = normalizeEnvValue(process.env.CLOUDINARY_API_SECRET);
  const folder = normalizeEnvValue(process.env.CLOUDINARY_FOLDER);

  const missing = CLOUDINARY_REQUIRED_KEYS.filter((key) => {
    if (key === "CLOUDINARY_CLOUD_NAME") {
      return !cloudName;
    }

    if (key === "CLOUDINARY_API_KEY") {
      return !apiKey;
    }

    return !apiSecret;
  });

  return {
    cloudName,
    apiKey,
    apiSecret,
    folder,
    missing,
  };
};

export const getCloudinaryEnvDiagnostics = () => {
  const cloudinaryEnv = readCloudinaryEnv();
  const cwd = process.cwd();

  return {
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    cwd,
    hasEnvFileHint:
      existsSync(join(cwd, ".env")) || existsSync(join(cwd, ".env.local")),
    cloudinary: {
      cloudName: Boolean(cloudinaryEnv.cloudName),
      apiKey: Boolean(cloudinaryEnv.apiKey),
      apiSecret: Boolean(cloudinaryEnv.apiSecret),
      folder: Boolean(cloudinaryEnv.folder),
    },
    envKeysSeenSample: Object.keys(process.env)
      .filter((key) => key.startsWith("CLOUDINARY_"))
      .sort(),
    missing: cloudinaryEnv.missing,
  };
};

export const assertCloudinaryEnv = () => {
  const cloudinaryEnv = readCloudinaryEnv();

  if (cloudinaryEnv.missing.length > 0) {
    throw new Error(
      `Missing Cloudinary environment variables: ${cloudinaryEnv.missing.join(", ")}`,
    );
  }

  return {
    cloudName: cloudinaryEnv.cloudName as string,
    apiKey: cloudinaryEnv.apiKey as string,
    apiSecret: cloudinaryEnv.apiSecret as string,
    folder: cloudinaryEnv.folder,
  };
};

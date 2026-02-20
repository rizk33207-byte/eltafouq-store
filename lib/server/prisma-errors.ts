import { Prisma } from "@prisma/client";

const transientPrismaCodes = new Set([
  "P1001",
  "P1002",
  "P1008",
  "P1017",
  "P2024",
  "P2028",
  "P2034",
]);

const transientMessagePatterns = [
  /E57P01/i,
  /terminating connection/i,
  /transaction already closed/i,
  /connection reset/i,
  /connection.*closed/i,
  /timeout/i,
  /timed out/i,
];

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error ?? "");
};

const getErrorCode = (error: unknown): string | undefined => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return "INIT_ERROR";
  }

  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" ? code : undefined;
};

const matchesTransientMessage = (error: unknown): boolean => {
  const message = getErrorMessage(error);
  return transientMessagePatterns.some((pattern) => pattern.test(message));
};

export const isDbUnavailable = (error: unknown): boolean => {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    transientPrismaCodes.has(error.code)
  ) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return matchesTransientMessage(error);
  }

  return matchesTransientMessage(error);
};

export const toHttpError = (
  error: unknown,
): { status: number; body: { error: string } } | null => {
  if (isDbUnavailable(error)) {
    return {
      status: 503,
      body: {
        error: "DB_UNAVAILABLE",
      },
    };
  }

  return null;
};

export const logDbErrorInDev = (route: string, error: unknown): void => {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.error("[db]", {
    route,
    code: getErrorCode(error),
    message: getErrorMessage(error).replace(/\s+/g, " ").slice(0, 300),
  });
};

export const isPrismaDbUnavailableError = isDbUnavailable;

export const logDbUnavailableInDev = (route: string, error: unknown): void => {
  logDbErrorInDev(route, error);
};

import type { NextResponse } from "next/server";
import type { AdminRole } from "@/lib/types";

export const ADMIN_SESSION_COOKIE = "admin_session";

const SESSION_DURATION_SECONDS = 60 * 60 * 12;
const JWT_HEADER = {
  alg: "HS256",
  typ: "JWT",
};

interface AdminJwtPayload {
  id: string;
  email: string;
  role: AdminRole;
  iat: number;
  exp: number;
}

export interface AdminSessionPayload {
  id: string;
  email: string;
  role: AdminRole;
}

const ADMIN_ROLES: AdminRole[] = ["SUPER_ADMIN", "ADMIN", "EDITOR"];

const getJwtSecret = (): string => {
  const value = process.env.ADMIN_JWT_SECRET?.trim();

  if (!value) {
    throw new Error("ADMIN_JWT_SECRET is missing.");
  }

  return value;
};

const bytesToBase64 = (bytes: Uint8Array): string => {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const base64ToBytes = (value: string): Uint8Array => {
  if (typeof Buffer !== "undefined") {
    return Uint8Array.from(Buffer.from(value, "base64"));
  }

  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

const encodeBase64Url = (value: string): string => {
  const bytes = new TextEncoder().encode(value);

  return bytesToBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
};

const decodeBase64Url = (value: string): string | null => {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const normalized = `${padded}${"=".repeat((4 - (padded.length % 4)) % 4)}`;
    const bytes = base64ToBytes(normalized);
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
};

const signJwt = async (data: string, secret: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data),
  );

  return bytesToBase64(new Uint8Array(signature))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
};

const parseCookie = (cookieHeader: string | null, key: string): string | undefined => {
  if (!cookieHeader) {
    return undefined;
  }

  const parts = cookieHeader.split(";").map((part) => part.trim());
  const found = parts.find((part) => part.startsWith(`${key}=`));

  if (!found) {
    return undefined;
  }

  return decodeURIComponent(found.slice(key.length + 1));
};

export const getAdminSessionTokenFromRequest = (request: Request): string | undefined => {
  const cookieStore = (
    request as Request & {
      cookies?: { get: (name: string) => { value: string } | undefined };
    }
  ).cookies;

  if (cookieStore?.get) {
    return cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  }

  return parseCookie(request.headers.get("cookie"), ADMIN_SESSION_COOKIE);
};

export const createAdminSessionToken = async (
  payload: AdminSessionPayload,
): Promise<string> => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const body: AdminJwtPayload = {
    id: payload.id,
    email: payload.email,
    role: payload.role,
    iat: nowSeconds,
    exp: nowSeconds + SESSION_DURATION_SECONDS,
  };

  const encodedHeader = encodeBase64Url(JSON.stringify(JWT_HEADER));
  const encodedPayload = encodeBase64Url(JSON.stringify(body));
  const signature = await signJwt(
    `${encodedHeader}.${encodedPayload}`,
    getJwtSecret(),
  );

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

export const readAdminSession = async (
  request: Request,
): Promise<AdminSessionPayload | null> => {
  const token = getAdminSessionTokenFromRequest(request);

  if (!token) {
    return null;
  }

  const [encodedHeader, encodedPayload, signature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !signature) {
    return null;
  }

  const decodedHeader = decodeBase64Url(encodedHeader);
  const decodedPayload = decodeBase64Url(encodedPayload);

  if (!decodedHeader || !decodedPayload) {
    return null;
  }

  try {
    const header = JSON.parse(decodedHeader) as { alg?: string; typ?: string };
    const payload = JSON.parse(decodedPayload) as Partial<AdminJwtPayload>;

    if (header.alg !== "HS256" || header.typ !== "JWT") {
      return null;
    }

    const expectedSignature = await signJwt(
      `${encodedHeader}.${encodedPayload}`,
      getJwtSecret(),
    );

    if (expectedSignature !== signature) {
      return null;
    }

    if (
      typeof payload.id !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    if (!ADMIN_ROLES.includes(payload.role as AdminRole)) {
      return null;
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: payload.id,
      email: payload.email,
      role: payload.role as AdminRole,
    };
  } catch {
    return null;
  }
};

export const setAdminSessionCookie = (
  response: NextResponse,
  token: string,
): void => {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
};

export const clearAdminSessionCookie = (response: NextResponse): void => {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
};

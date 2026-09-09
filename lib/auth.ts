import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_TTL_SECONDS } from "./authConstants";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";
export { ACCESS_TOKEN_TTL_SECONDS };
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
export const MAX_PARALLEL_SESSIONS = 2;

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
if (!ACCESS_SECRET) throw new Error("JWT_ACCESS_SECRET is not set");

export type AccessTokenPayload = {
  sub: string;
  email: string;
  name: string | null;
  role: string | null;
};

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, ACCESS_SECRET as string, { expiresIn: ACCESS_TOKEN_TTL_SECONDS });
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET as string) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function generateRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

export function getCookieValue(request: Request, name: string) {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function getAuthUser(request: Request): AccessTokenPayload | null {
  const token = getCookieValue(request, ACCESS_TOKEN_COOKIE);
  return token ? verifyAccessToken(token) : null;
}

export function isAuthenticated(request: Request) {
  return !!getAuthUser(request);
}

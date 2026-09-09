import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_TTL_SECONDS,
  MAX_PARALLEL_SESSIONS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_TTL_SECONDS,
  generateRefreshToken,
  signAccessToken,
  verifyPassword,
} from "../../../../lib/auth";
import { describeDevice, logActivity } from "../../../../lib/profile";
import { checkRateLimit, getClientIp } from "../../../../lib/rateLimit";

const IP_LIMIT = 20;
const IP_WINDOW_MS = 5 * 60 * 1000;
const EMAIL_LIMIT = 5;
const EMAIL_WINDOW_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  const { email, password } = await request.json();
  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const ip = getClientIp(request);
  const ipLimit = checkRateLimit(`login:ip:${ip}`, IP_LIMIT, IP_WINDOW_MS);
  if (!ipLimit.allowed) {
    return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });
  }
  const emailLimit = checkRateLimit(`login:email:${email.toLowerCase()}`, EMAIL_LIMIT, EMAIL_WINDOW_MS);
  if (!emailLimit.allowed) {
    return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.password))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const activeSessions = await prisma.session.count({ where: { userId: user.id } });
  if (activeSessions >= MAX_PARALLEL_SESSIONS) {
    return NextResponse.json(
      { error: "Too many parallel logins. Log out from another device and try again." },
      { status: 403 },
    );
  }

  const refreshToken = generateRefreshToken();
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      userAgent: request.headers.get("user-agent") ?? undefined,
    },
  });

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  await logActivity(user.id, "Signed in", describeDevice(request.headers.get("user-agent")));

  const response = NextResponse.json({ user: { name: user.name, role: user.role } });
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  });
  return response;
}

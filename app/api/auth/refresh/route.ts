import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_TTL_SECONDS,
  generateRefreshToken,
  getCookieValue,
  signAccessToken,
} from "../../../../lib/auth";

export async function POST(request: Request) {
  const refreshToken = getCookieValue(request, REFRESH_TOKEN_COOKIE);

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  const session = await prisma.session.findUnique({
    where: { refreshToken },
    include: { user: true },
  });
  if (!session) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  const newRefreshToken = generateRefreshToken();
  await prisma.session.update({
    where: { id: session.id },
    data: { refreshToken: newRefreshToken },
  });

  const accessToken = signAccessToken({
    sub: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, newRefreshToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  });
  return response;
}

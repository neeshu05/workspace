import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, getCookieValue } from "../../../../lib/auth";

export async function POST(request: Request) {
  const refreshToken = getCookieValue(request, REFRESH_TOKEN_COOKIE);

  if (refreshToken) {
    await prisma.session.deleteMany({ where: { refreshToken } });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", { path: "/api/auth", maxAge: 0 });
  return response;
}

import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { isAuthenticated } from "../../../../../lib/auth";
import { recordAlertClosed } from "../../../../../lib/alertStats";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.alert.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Alert not found" }, { status: 404 });

  if (!existing.closed) {
    const result = await prisma.alert.updateMany({ where: { id, closed: false }, data: { closed: true } });
    if (result.count === 1) await recordAlertClosed();
  }

  return NextResponse.json({ ok: true });
}

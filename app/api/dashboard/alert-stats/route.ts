import { NextResponse } from "next/server";
import { isAuthenticated } from "../../../../lib/auth";
import { getAlertStats } from "../../../../lib/alertStats";

export async function GET(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: "Session expired" }, { status: 401 });
  const stats = await getAlertStats();
  return NextResponse.json({ total: stats.total, active: stats.active, closed: stats.closed });
}

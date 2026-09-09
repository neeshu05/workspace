import { NextResponse } from "next/server";
import { isAuthenticated } from "../../../../lib/auth";
import { buildSummary } from "../../../../lib/dashboardMetrics";

export async function GET(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: "Session expired" }, { status: 401 });
  return NextResponse.json(buildSummary());
}

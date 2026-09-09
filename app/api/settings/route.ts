import { NextResponse } from "next/server";
import { isAuthenticated } from "../../../lib/auth";
import { getSettings, updateSettings } from "../../../lib/settings";

export async function GET(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: "Session expired" }, { status: 401 });
  const settings = await getSettings();
  return NextResponse.json({ liveTrackingPaused: settings.liveTrackingPaused });
}

export async function PATCH(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (typeof body.liveTrackingPaused !== "boolean") {
    return NextResponse.json({ error: "liveTrackingPaused must be a boolean" }, { status: 400 });
  }

  const settings = await updateSettings({ liveTrackingPaused: body.liveTrackingPaused });
  return NextResponse.json({ liveTrackingPaused: settings.liveTrackingPaused });
}

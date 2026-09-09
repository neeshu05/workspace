import { isAuthenticated } from "../../../../lib/auth";
import { getSettings } from "../../../../lib/settings";
import { LiveStatus, generateReading } from "../../../../lib/liveMetrics";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAuthenticated(request)) return new Response("Session expired", { status: 401 });
  const settings = await getSettings();
  if (settings.liveTrackingPaused) return new Response("Live tracking paused", { status: 409 });

  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      let previousStatus: LiveStatus | null = null;
      const send = () => {
        try {
          const reading = generateReading(previousStatus);
          previousStatus = reading.status;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(reading)}\n\n`));
        } catch {
          if (timer) clearInterval(timer);
        }
      };
      send();
      timer = setInterval(send, 2500);
    },
    cancel() {
      if (timer) clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
  });
}

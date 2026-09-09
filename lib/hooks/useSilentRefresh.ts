import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { refreshSession } from "../services/authService";
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_MARGIN_SECONDS } from "../authConstants";

export function useSilentRefresh() {
  const router = useRouter();
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await refreshSession();
        if (!cancelled && !res.ok) {
          router.push("/login");
          router.refresh();
        }
      } catch {
        // transient network error, retry on next tick
      }
    };
    const timer = setInterval(tick, (ACCESS_TOKEN_TTL_SECONDS - REFRESH_MARGIN_SECONDS) * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [router]);
}

"use client";
import { useEffect } from "react";

export default function GlobalErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#102728", color: "#eff6f4", padding: 24, fontFamily: "Manrope, Arial, sans-serif" }}>
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>Something went wrong</h1>
        <p style={{ color: "#a8bfbb", marginBottom: 24, lineHeight: 1.6 }}>
          An unexpected error interrupted this page. You can try again, or head back to the dashboard.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={reset}
            style={{ background: "#137b70", color: "#fff", border: 0, padding: "11px 18px", borderRadius: 7, cursor: "pointer", fontWeight: 700 }}
          >
            Try again
          </button>
          <a
            href="/dashboard"
            style={{ background: "transparent", color: "#eff6f4", border: "1px solid #2d4647", padding: "11px 18px", borderRadius: 7, textDecoration: "none", fontWeight: 700 }}
          >
            Back to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

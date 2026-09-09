"use client";
import { useEffect } from "react";

export default function DashboardErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="content">
      <div className="page-title">
        <div>
          <h1>Something went wrong</h1>
          <p>This page hit an unexpected error. The rest of the dashboard is still available from the sidebar.</p>
        </div>
      </div>
      <article className="panel" style={{ maxWidth: 480 }}>
        <h3>Error details</h3>
        <p style={{ fontFamily: "monospace", fontSize: 12, color: "#c75644", wordBreak: "break-word" }}>{error.message || "Unknown error"}</p>
        <button onClick={reset} style={{ background: "#137b70", color: "#fff", border: 0, padding: "11px 18px", borderRadius: 7, cursor: "pointer", fontWeight: 700, marginTop: 14 }}>
          Try again
        </button>
      </article>
    </section>
  );
}

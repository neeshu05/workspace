"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter(); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget); const result = await fetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
    if (!result.ok) { setError("Use the demo credentials shown below."); setLoading(false); return; } router.push("/dashboard"); router.refresh();
  }
  return <main className="login-page"><section className="login-intro"><div className="brand-mark">A</div><p className="eyebrow">APEX WAREHOUSE</p><h1>Operations, always in motion.</h1><p>Monitor the pulse of your fulfillment network, react to live floor events, and keep every shift on track.</p><div className="login-stats"><span><b>99.8%</b> fulfillment accuracy</span><span><b>24/7</b> live operations view</span></div></section><section className="login-card"><p className="eyebrow">WELCOME BACK</p><h2>Sign in to command center</h2><form onSubmit={signIn}><label>Work email<input name="email" defaultValue="operator@apex.io" type="email" /></label><label>Password<input name="password" defaultValue="warehouse2026" type="password" /></label>{error && <p className="form-error">{error}</p>}<button disabled={loading}>{loading ? "Entering workspace..." : "Enter dashboard"}</button></form><p className="demo">Demo: operator@apex.io / warehouse2026</p></section></main>;
}

export async function login(email: string, password: string) {
  const res = await fetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export function logout() {
  return fetch("/api/auth/logout", { method: "POST" });
}

export function refreshSession() {
  return fetch("/api/auth/refresh", { method: "POST" });
}

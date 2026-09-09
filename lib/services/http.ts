export class UnauthorizedError extends Error {
  constructor() {
    super("Session expired");
    this.name = "UnauthorizedError";
  }
}

async function throwForStatus(res: Response, fallback: string): Promise<never> {
  if (res.status === 401) throw new UnauthorizedError();
  const body = await res.json().catch(() => null);
  throw new Error((body && typeof body.error === "string" && body.error) || fallback);
}

export async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) await throwForStatus(res, `Request failed (${res.status})`);
  return res.json();
}

export async function patchJson<T>(url: string, data: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) await throwForStatus(res, `Request failed (${res.status})`);
  return res.json();
}

export function redirectToLogin() {
  window.location.assign("/login");
}

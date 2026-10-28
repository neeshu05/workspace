export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'same-origin',
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error ?? res.statusText);
  return body as T;
}

export type Status = 'preparing' | 'ready' | 'completed' | 'cancelled';

export type StaffOrder = {
  id: string;
  orderNumber: string;
  status: Status;
  token: string;
  trackUrl: string;
  createdAt: string;
  readyAt: string | null;
};

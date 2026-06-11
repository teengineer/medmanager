const BASE_URL = "/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API error ${status}`);
  }
}

export interface MeDto {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  image: string | null;
  locale: string;
  timeZone: string;
  emailVerified: boolean;
  hasPassword: boolean;
  createdAt: string;
}

export function displayName(me: { firstName?: string | null; lastName?: string | null; email: string } | null | undefined): string {
  if (!me) return "";
  const first = me.firstName?.trim();
  const last = me.lastName?.trim();
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  return me.email.split("@")[0] ?? me.email;
}

export function displayInitial(me: { firstName?: string | null; email: string } | null | undefined): string {
  if (!me) return "?";
  return (me.firstName?.[0] ?? me.email[0] ?? "?").toUpperCase();
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept-Language")) {
    const lang =
      (typeof window !== "undefined" && window.localStorage.getItem("bundanvar.lang")) ||
      (typeof document !== "undefined" && document.documentElement.lang) ||
      "tr";
    headers.set("Accept-Language", lang);
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

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
  locale: "tr" | "en";
  timeZone: string;
  hasPassword: boolean;
  createdAt: string;
}

export function displayName(me: MeDto | null | undefined): string {
  if (!me) return "";
  const first = me.firstName?.trim();
  const last = me.lastName?.trim();
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  return me.email.split("@")[0] ?? me.email;
}

export function displayInitial(me: MeDto | null | undefined): string {
  if (!me) return "?";
  return (me.firstName?.[0] ?? me.email[0] ?? "?").toUpperCase();
}

export interface AuthResponse {
  accessToken: string;
  expiresInSeconds: number;
  user: MeDto;
}

let accessToken: string | null = null;
let refreshingPromise: Promise<AuthResponse | null> | null = null;

export const auth = {
  get token() {
    return accessToken;
  },
  set token(value: string | null) {
    accessToken = value;
  },
};

async function refreshTokens(): Promise<AuthResponse | null> {
  if (refreshingPromise) return refreshingPromise;
  refreshingPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return null;
      const body = (await res.json()) as AuthResponse;
      accessToken = body.accessToken;
      return body;
    } finally {
      refreshingPromise = null;
    }
  })();
  return refreshingPromise;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const send = async (token: string | null) => {
    const headers = new Headers(init.headers);
    if (!headers.has("Content-Type") && init.body) {
      headers.set("Content-Type", "application/json");
    }
    if (!headers.has("Accept-Language")) {
      const lang =
        (typeof window !== "undefined" && window.localStorage.getItem("medmanager.lang")) ||
        (typeof document !== "undefined" && document.documentElement.lang) ||
        "tr";
      headers.set("Accept-Language", lang);
    }
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(`${BASE_URL}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
  };

  let res = await send(accessToken);

  if (res.status === 401 && !path.startsWith("/auth/")) {
    const refreshed = await refreshTokens();
    if (!refreshed) {
      accessToken = null;
      throw new ApiError(401, null);
    }
    res = await send(refreshed.accessToken);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export { refreshTokens };

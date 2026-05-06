import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth, type Session } from "./auth";

export const getSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<Session | null> => {
    try {
      const headers = getRequestHeaders();
      const session = await auth.api.getSession({ headers });
      return session;
    } catch {
      return null;
    }
  },
);

export async function requireSession(request: Request): Promise<Session> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return session;
}

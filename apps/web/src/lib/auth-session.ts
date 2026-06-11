import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import type { Session } from "./auth";

export const getSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<Session | null> => {
    try {
      // Dynamic import keeps the server-only auth/db/pg graph out of the client bundle.
      const { auth } = await import("./auth");
      const headers = getRequestHeaders();
      const session = await auth.api.getSession({ headers });
      return session;
    } catch {
      return null;
    }
  },
);

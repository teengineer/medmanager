import { createFileRoute } from "@tanstack/react-router";
import { runExpiryTick } from "~/server/expiry";

export const Route = createFileRoute("/api/cron/expiry")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const secret = process.env.CRON_SECRET;
        const provided = request.headers.get("x-cron-secret");
        if (secret && provided !== secret) {
          return new Response("Forbidden", { status: 403 });
        }
        const result = await runExpiryTick();
        return Response.json(result);
      },
      GET: async ({ request }: { request: Request }) => {
        const secret = process.env.CRON_SECRET;
        const provided = request.headers.get("x-cron-secret");
        if (secret && provided !== secret) {
          return new Response("Forbidden", { status: 403 });
        }
        const result = await runExpiryTick();
        return Response.json(result);
      },
    },
  },
});

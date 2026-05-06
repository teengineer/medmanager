import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/push/vapid-public-key")({
  server: {
    handlers: {
      GET: () => {
        const publicKey = process.env.PUSH_PUBLIC_KEY ?? "";
        return Response.json({
          publicKey: publicKey || null,
          configured: Boolean(publicKey && process.env.PUSH_PRIVATE_KEY),
        });
      },
    },
  },
});

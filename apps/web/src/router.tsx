import { createRouter as createTanstackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { QueryClient } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 30,
        gcTime: 1000 * 60 * 60 * 24 * 7,
      },
    },
  });

  const router = routerWithQueryClient(
    createTanstackRouter({
      routeTree,
      scrollRestoration: true,
      defaultPreload: "intent",
      defaultPendingMinMs: 200,
      context: { queryClient, session: null as never },
    }),
    queryClient,
  );

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    port: 5173,
    watch: {
      ignored: ["**/routeTree.gen.ts"],
    },
  },
  plugins: [
    tsConfigPaths(),
    tanstackStart(),
    viteReact(),
    tailwindcss(),
  ],
  ssr: {
    external: ["node:stream", "node:stream/web", "node:async_hooks"],
  },
  environments: {
    client: {
      build: {
        rollupOptions: {
          external: ["node:stream", "node:stream/web", "node:async_hooks"],
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-router",
      "@tanstack/react-query",
    ],
  },
});
